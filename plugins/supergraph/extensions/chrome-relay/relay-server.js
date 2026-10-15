/**
 * Supergraph Chrome Relay Server
 * Zero-dependency RFC 6455 WebSocket & CDP Relay Bridge
 */

import http from "node:http";
import crypto from "node:crypto";

const PORT = process.env.PORT || 9333;
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

let extensionWs = null;
let cachedTabs = [];
const cdpClients = new Map(); // tabId -> Set of sockets
const pendingCommands = new Map(); // id -> { cdpSocket, originalId }

// Lightweight RFC 6455 Frame Parser & Encoder
function createWebSocket(socket) {
  const ws = {
    socket,
    isAlive: true,
    send(data) {
      if (!socket.writable) return;
      const payload = Buffer.from(typeof data === "string" ? data : JSON.stringify(data));
      const length = payload.length;
      let header;

      if (length < 126) {
        header = Buffer.alloc(2);
        header[0] = 0x81; // FIN + text opcode
        header[1] = length;
      } else if (length < 65536) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 126;
        header.writeUInt16BE(length, 2);
      } else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(length), 2);
      }

      socket.write(Buffer.concat([header, payload]));
    },
    onMessage: null,
    onClose: null
  };

  let buffer = Buffer.alloc(0);

  socket.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 2) {
      const firstByte = buffer[0];
      const secondByte = buffer[1];
      const opcode = firstByte & 0x0f;
      const isMasked = (secondByte & 0x80) !== 0;
      let payloadLength = secondByte & 0x7f;
      let offset = 2;

      if (payloadLength === 126) {
        if (buffer.length < 4) return;
        payloadLength = buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLength === 127) {
        if (buffer.length < 10) return;
        payloadLength = Number(buffer.readBigUInt64BE(2));
        offset = 10;
      }

      const maskKeyLength = isMasked ? 4 : 0;
      const totalLength = offset + maskKeyLength + payloadLength;
      if (buffer.length < totalLength) return;

      let maskKey = null;
      if (isMasked) {
        maskKey = buffer.subarray(offset, offset + 4);
        offset += 4;
      }

      const payload = buffer.subarray(offset, offset + payloadLength);
      buffer = buffer.subarray(totalLength);

      if (isMasked) {
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= maskKey[i % 4];
        }
      }

      if (opcode === 0x08) {
        // Close frame
        socket.end();
        if (ws.onClose) ws.onClose();
        return;
      } else if (opcode === 0x09) {
        // Ping -> send Pong
        const pong = Buffer.alloc(2);
        pong[0] = 0x8a;
        pong[1] = 0x00;
        socket.write(pong);
      } else if (opcode === 0x01 || opcode === 0x02) {
        // Text or binary
        if (ws.onMessage) {
          ws.onMessage(payload.toString("utf8"));
        }
      }
    }
  });

  socket.on("close", () => {
    ws.isAlive = false;
    if (ws.onClose) ws.onClose();
  });

  socket.on("error", (err) => {
    ws.isAlive = false;
    if (ws.onClose) ws.onClose(err);
  });

  return ws;
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/json/version") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      Browser: "Chrome/Supergraph-Relay",
      "Protocol-Version": "1.3",
      "User-Agent": "Supergraph-Chrome-Relay/1.0",
      "V8-Version": "11.0",
      "WebKit-Version": "537.36",
      webSocketDebuggerUrl: `ws://127.0.0.1:${PORT}/devtools/browser`
    }, null, 2));
    return;
  }

  if (url.pathname === "/json" || url.pathname === "/json/list") {
    const list = cachedTabs.map(t => ({
      description: "",
      devtoolsFrontendUrl: "",
      id: String(t.id),
      title: t.title || "Chrome Tab",
      type: "page",
      url: t.url || "about:blank",
      webSocketDebuggerUrl: `ws://127.0.0.1:${PORT}/devtools/page/${t.id}`
    }));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(list, null, 2));
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Supergraph Relay Server Active");
});

server.on("upgrade", (req, socket, head) => {
  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  const hash = crypto.createHash("sha1").update(key + WS_GUID).digest("base64");
  const responseHeaders = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${hash}`
  ];

  socket.write(responseHeaders.join("\r\n") + "\r\n\r\n");
  const ws = createWebSocket(socket);

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/extension") {
    console.log("[Relay] Chrome Extension connected.");
    extensionWs = ws;

    ws.onMessage = (msgStr) => {
      try {
        const msg = JSON.parse(msgStr);
        if (msg.type === "tabs_list") {
          cachedTabs = msg.tabs || [];
        } else if (msg.type === "cdp_response") {
          const pending = pendingCommands.get(msg.id);
          if (pending) {
            pendingCommands.delete(msg.id);
            const resObj = { id: pending.originalId };
            if (msg.error) resObj.error = msg.error;
            if (msg.result) resObj.result = msg.result;
            pending.cdpSocket.send(JSON.stringify(resObj));
          }
        } else if (msg.type === "cdp_event") {
          const clients = cdpClients.get(String(msg.tabId));
          if (clients) {
            const eventStr = JSON.stringify({
              method: msg.method,
              params: msg.params
            });
            for (const client of clients) {
              client.send(eventStr);
            }
          }
        }
      } catch (err) {
        console.error("[Relay] Error processing extension message:", err);
      }
    };

    ws.onClose = () => {
      console.log("[Relay] Chrome Extension disconnected.");
      if (extensionWs === ws) extensionWs = null;
    };
    return;
  }

  const match = url.pathname.match(/\/devtools\/page\/(\d+)/);
  if (match) {
    const tabId = match[1];
    console.log(`[Relay] CDP Client attached to tab ${tabId}`);

    if (!cdpClients.has(tabId)) {
      cdpClients.set(tabId, new Set());
    }
    cdpClients.get(tabId).add(ws);

    let commandCounter = 1;

    ws.onMessage = (msgStr) => {
      try {
        const cmd = JSON.parse(msgStr);
        const internalId = `${tabId}_${Date.now()}_${commandCounter++}`;
        pendingCommands.set(internalId, {
          cdpSocket: ws,
          originalId: cmd.id
        });

        if (extensionWs) {
          extensionWs.send({
            type: "cdp_command",
            tabId: parseInt(tabId, 10),
            id: internalId,
            method: cmd.method,
            params: cmd.params
          });
        } else {
          ws.send(JSON.stringify({
            id: cmd.id,
            error: { message: "Extension is not connected to Supergraph Relay Server" }
          }));
        }
      } catch (err) {
        console.error("[Relay] Error forwarding CDP command:", err);
      }
    };

    ws.onClose = () => {
      console.log(`[Relay] CDP Client detached from tab ${tabId}`);
      const set = cdpClients.get(tabId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) {
          cdpClients.delete(tabId);
          if (extensionWs) {
            extensionWs.send({
              type: "detach_tab",
              tabId: parseInt(tabId, 10)
            });
          }
        }
      }
    };
    return;
  }

  // Fallback for default browser target
  socket.destroy();
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`🚀 Supergraph Chrome Relay running at http://127.0.0.1:${PORT}`);
  console.log(`👉 CDP Discovery: http://127.0.0.1:${PORT}/json/version`);
  console.log(`👉 Active Tabs:   http://127.0.0.1:${PORT}/json/list`);
});

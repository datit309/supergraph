// Supergraph Chrome Relay - Background Service Worker
const RELAY_WS_URL = "ws://127.0.0.1:9333/extension";
let socket = null;
let reconnectTimer = null;
const attachedTabs = new Set();

function log(...args) {
  console.log("[Supergraph Relay]", ...args);
}

function connect() {
  if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
    return;
  }

  try {
    socket = new WebSocket(RELAY_WS_URL);
  } catch (err) {
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    log("Connected to Supergraph local relay server.");
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    syncTabs();
  };

  socket.onclose = () => {
    log("Disconnected from local relay server.");
    socket = null;
    scheduleReconnect();
  };

  socket.onerror = (err) => {
    log("WebSocket error:", err);
  };

  socket.onmessage = async (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleServerMessage(msg);
    } catch (e) {
      log("Error parsing message:", e);
    }
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 2000);
}

async function syncTabs() {
  const tabs = await chrome.tabs.query({});
  const tabList = tabs.map(t => ({
    id: t.id,
    title: t.title,
    url: t.url,
    active: t.active,
    windowId: t.windowId
  }));
  send({ type: "tabs_list", tabs: tabList });
}

function send(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

async function attachTab(tabId) {
  if (attachedTabs.has(tabId)) return true;
  return new Promise((resolve) => {
    chrome.debugger.attach({ tabId }, "1.3", () => {
      if (chrome.runtime.lastError) {
        log(`Failed to attach to tab ${tabId}:`, chrome.runtime.lastError.message);
        resolve(false);
      } else {
        attachedTabs.add(tabId);
        log(`Attached to tab ${tabId}`);
        resolve(true);
      }
    });
  });
}

function detachTab(tabId) {
  if (!attachedTabs.has(tabId)) return;
  chrome.debugger.detach({ tabId }, () => {
    attachedTabs.delete(tabId);
    log(`Detached from tab ${tabId}`);
  });
}

async function handleServerMessage(msg) {
  switch (msg.type) {
    case "get_tabs": {
      syncTabs();
      break;
    }
    case "attach_tab": {
      const ok = await attachTab(msg.tabId);
      send({ type: "attach_response", tabId: msg.tabId, success: ok });
      break;
    }
    case "detach_tab": {
      detachTab(msg.tabId);
      send({ type: "detach_response", tabId: msg.tabId, success: true });
      break;
    }
    case "cdp_command": {
      const { tabId, id, method, params } = msg;
      if (!attachedTabs.has(tabId)) {
        const attached = await attachTab(tabId);
        if (!attached) {
          send({
            type: "cdp_response",
            id,
            error: { message: `Could not attach to tab ${tabId}` }
          });
          return;
        }
      }

      chrome.debugger.sendCommand({ tabId }, method, params || {}, (result) => {
        if (chrome.runtime.lastError) {
          send({
            type: "cdp_response",
            id,
            error: { message: chrome.runtime.lastError.message }
          });
        } else {
          send({
            type: "cdp_response",
            id,
            result: result || {}
          });
        }
      });
      break;
    }
    default:
      log("Unknown server message type:", msg.type);
  }
}

chrome.debugger.onEvent.addListener((source, method, params) => {
  send({
    type: "cdp_event",
    tabId: source.tabId,
    method,
    params
  });
});

chrome.debugger.onDetach.addListener((source, reason) => {
  if (source.tabId) {
    attachedTabs.delete(source.tabId);
    log(`Tab ${source.tabId} detached:`, reason);
    send({
      type: "tab_detached",
      tabId: source.tabId,
      reason
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    syncTabs();
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  attachedTabs.delete(tabId);
  syncTabs();
});

// Initial startup
connect();

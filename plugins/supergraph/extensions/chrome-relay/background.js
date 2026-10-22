// Supergraph Chrome Relay - Background Service Worker
const RELAY_WS_URL = "ws://127.0.0.1:9333/extension";
let socket = null;
let reconnectTimer = null;
const attachedTabs = new Set();
const tabIdleTimers = new Map();
const IDLE_DETACH_TIMEOUT_MS = 5000; // Auto-detach after 5s of inactivity to remove Chrome debug infobar

function log(...args) {
  console.log("[Supergraph Relay]", ...args);
}

function clearIdleTimer(tabId) {
  if (tabIdleTimers.has(tabId)) {
    clearTimeout(tabIdleTimers.get(tabId));
    tabIdleTimers.delete(tabId);
  }
}

function resetIdleTimer(tabId) {
  clearIdleTimer(tabId);
  const timer = setTimeout(() => {
    tabIdleTimers.delete(tabId);
    log(`Auto-detaching tab ${tabId} after 5s idle.`);
    detachTab(tabId);
  }, IDLE_DETACH_TIMEOUT_MS);
  tabIdleTimers.set(tabId, timer);
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
    // Clean up any stale attachments from prior sessions immediately
    detachAllTabs();
    syncTabs();
  };

  socket.onclose = () => {
    log("Disconnected from local relay server.");
    socket = null;
    // When relay server disconnects, detach tabs immediately so no banner remains
    detachAllTabs();
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

async function markTabActive(tabId) {
  try {
    // Only set extension icon badge in toolbar — NO intrusive DOM injection on user page
    await chrome.action.setBadgeText({ tabId, text: "AI" });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: "#0284c7" });
  } catch (err) {
    log("Error setting tab badge:", err);
  }
}

async function unmarkTab(tabId) {
  try {
    await chrome.action.setBadgeText({ tabId, text: "" });
    // Clean up any legacy HUD element or title modification if previously present
    const removeScript = `
      (() => {
        if (window.__sg_original_title) {
          document.title = window.__sg_original_title;
          delete window.__sg_original_title;
        } else if (document.title.startsWith("⚡ [AI] ")) {
          document.title = document.title.replace(/^⚡ \\[AI\\] /, "");
        }
        document.getElementById("supergraph-ai-hud")?.remove();
        document.getElementById("supergraph-ai-hud-style")?.remove();
      })()
    `;
    chrome.debugger.sendCommand({ tabId }, "Runtime.evaluate", { expression: removeScript }, () => {
      if (chrome.runtime.lastError) { /* ignore */ }
    });
  } catch (err) {
    // tab might be already closed
  }
}

async function attachTab(tabId) {
  if (attachedTabs.has(tabId)) {
    resetIdleTimer(tabId);
    return { ok: true };
  }
  return new Promise((resolve) => {
    chrome.debugger.attach({ tabId }, "1.3", () => {
      if (chrome.runtime.lastError) {
        const errMsg = chrome.runtime.lastError.message;
        log(`Failed to attach to tab ${tabId}:`, errMsg);
        resolve({ ok: false, error: errMsg });
      } else {
        attachedTabs.add(tabId);
        markTabActive(tabId);
        resetIdleTimer(tabId);
        log(`Attached to tab ${tabId}`);
        resolve({ ok: true });
      }
    });
  });
}

function detachTab(tabId) {
  clearIdleTimer(tabId);
  if (!attachedTabs.has(tabId)) return;
  unmarkTab(tabId);
  chrome.debugger.detach({ tabId }, () => {
    attachedTabs.delete(tabId);
    log(`Detached from tab ${tabId}`);
  });
}

function detachAllTabs() {
  for (const tabId of Array.from(attachedTabs)) {
    detachTab(tabId);
  }
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
    case "detach_all": {
      detachAllTabs();
      send({ type: "detach_all_response", success: true });
      break;
    }
    case "cdp_command": {
      const { tabId, id, method, params } = msg;
      if (!attachedTabs.has(tabId)) {
        const attachRes = await attachTab(tabId);
        if (!attachRes.ok) {
          send({
            type: "cdp_response",
            id,
            error: { message: `Could not attach to tab ${tabId}: ${attachRes.error}` }
          });
          return;
        }
      }

      resetIdleTimer(tabId);

      chrome.debugger.sendCommand({ tabId }, method, params || {}, (result) => {
        resetIdleTimer(tabId);
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
    case "pong": {
      // Keepalive response from server
      break;
    }
    default:
      log("Unknown server message type:", msg.type);
  }
}

// Keepalive ping every 20s to prevent Manifest V3 Service Worker sleep
setInterval(() => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    send({ type: "ping" });
  }
}, 20000);

// Listen for messages from popup (e.g. manual reconnect)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "reconnect") {
    connect();
    sendResponse({ ok: true, connected: socket && socket.readyState === WebSocket.OPEN });
  }
  return true;
});

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
    unmarkTab(source.tabId);
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

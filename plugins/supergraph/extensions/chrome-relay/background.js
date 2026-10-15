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

async function markTabActive(tabId) {
  try {
    await chrome.action.setBadgeText({ tabId, text: "AI" });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: "#0284c7" });
    
    // Inject visual indicator pill and prefix tab title on Chrome tab strip
    const badgeScript = `
      (() => {
        // 1. Prefix Chrome tab title
        if (!window.__sg_original_title) {
          window.__sg_original_title = document.title;
        }
        if (!document.title.startsWith("⚡ [AI] ")) {
          document.title = "⚡ [AI] " + window.__sg_original_title;
        }

        // 2. Inject floating HUD pill
        if (document.getElementById("supergraph-ai-hud")) return;
        const hud = document.createElement("div");
        hud.id = "supergraph-ai-hud";
        hud.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;margin-right:8px;animation:sg-pulse 1.2s infinite ease-in-out;"></span><span style="font-weight:700;font-size:11px;letter-spacing:0.8px;color:#38bdf8;text-transform:uppercase;">Supergraph AI Control</span>';
        hud.setAttribute("style", "position:fixed!important;top:14px!important;right:18px!important;z-index:2147483647!important;display:flex!important;align-items:center!important;padding:6px 14px!important;background:rgba(15,23,42,0.92)!important;backdrop-filter:blur(8px)!important;border:1.5px solid #0284c7!important;border-radius:9999px!important;box-shadow:0 4px 20px rgba(0,0,0,0.5),0 0 15px rgba(2,132,199,0.35)!important;pointer-events:none!important;font-family:-apple-system,BlinkMacSystemFont,\\"Segoe UI\\",Roboto,sans-serif!important;user-select:none!important;");
        
        const style = document.createElement("style");
        style.id = "supergraph-ai-hud-style";
        style.textContent = "@keyframes sg-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.35;transform:scale(0.8)}}";
        
        document.documentElement.appendChild(style);
        document.documentElement.appendChild(hud);
      })()
    `;
    chrome.debugger.sendCommand({ tabId }, "Runtime.evaluate", { expression: badgeScript }, () => {
      if (chrome.runtime.lastError) { /* ignore restricted tabs like chrome:// */ }
    });
  } catch (err) {
    log("Error setting tab badge:", err);
  }
}

async function unmarkTab(tabId) {
  try {
    await chrome.action.setBadgeText({ tabId, text: "" });
    const removeScript = `
      (() => {
        // 1. Restore original tab title
        if (window.__sg_original_title) {
          document.title = window.__sg_original_title;
          delete window.__sg_original_title;
        } else if (document.title.startsWith("⚡ [AI] ")) {
          document.title = document.title.replace(/^⚡ \\[AI\\] /, "");
        }

        // 2. Remove floating HUD pill
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
  if (attachedTabs.has(tabId)) return true;
  return new Promise((resolve) => {
    chrome.debugger.attach({ tabId }, "1.3", () => {
      if (chrome.runtime.lastError) {
        log(`Failed to attach to tab ${tabId}:`, chrome.runtime.lastError.message);
        resolve(false);
      } else {
        attachedTabs.add(tabId);
        markTabActive(tabId);
        log(`Attached to tab ${tabId}`);
        resolve(true);
      }
    });
  });
}

function detachTab(tabId) {
  if (!attachedTabs.has(tabId)) return;
  unmarkTab(tabId);
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

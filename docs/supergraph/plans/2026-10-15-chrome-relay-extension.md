# Implementation Plan - Supergraph Chrome Relay Extension

**Objective:** Create a Chrome Extension (Manifest V3) + Local CDP Relay Server that allows `agent-browser` and Supergraph AI agents to directly control the user's authentic Google Chrome instance using `chrome.debugger` API without restarting Chrome or disabling security flags.

## Architecture & Contracts

```
[ agent-browser (Rust CDP Client) ]
               │ (Standard CDP WebSocket)
               ▼
[ Supergraph Relay Server (Node.js :9333) ]
  • HTTP /json/version, /json/list (CDP discovery endpoints)
  • WS /devtools/page/:id (Client CDP connection)
  • WS /extension (Chrome extension control channel)
               ▲
               │ (Bidirectional JSON-RPC Relay)
               ▼
[ Supergraph Chrome Extension (MV3) ]
  • chrome.debugger.attach({ tabId }, "1.3")
  • chrome.debugger.sendCommand(target, method, params)
  • chrome.debugger.onEvent.addListener(...)
               ▲
               │ (Native Browser Engine)
               ▼
[ User's Real Authenticated Chrome Tabs ]
```

### Data Contract: CDP JSON-RPC Bridge
- Client -> Server: `{"id": number, "method": string, "params": object}`
- Server -> Extension: `{"type": "cdp_command", "tabId": number, "id": number, "method": string, "params": object}`
- Extension -> Browser: `chrome.debugger.sendCommand({ tabId }, method, params)`
- Extension -> Server: `{"type": "cdp_response", "id": number, "result": object, "error": object}`
- Server -> Client: `{"id": number, "result": object, "error": object}`
- Extension Events -> Server -> Client: `{"method": string, "params": object}`

## Execution Steps

1. Create extension manifest and files in `supergraph/plugins/supergraph/extensions/chrome-relay/`
2. Implement `manifest.json` (MV3, debugger, tabs, storage permissions)
3. Implement `background.js` (WebSocket client, auto-reconnect, `chrome.debugger` bridge)
4. Implement `popup.html` and `popup.js` (connection status badge, active tab selector)
5. Implement `relay-server.js` (HTTP CDP endpoints `/json/version`, `/json/list`, WebSocket router)
6. Add runner script `bin/supergraph-relay`
7. Verify relay server and CDP compatibility

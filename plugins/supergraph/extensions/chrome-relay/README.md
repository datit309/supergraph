# Supergraph Chrome Relay Extension

Enables Supergraph AI agents and `agent-browser` (Rust CDP) to directly control your authentic, active Google Chrome browser sessions without restarting Chrome, bypassing 100% of Cloudflare, Akamai, and bot detection walls.

## Features
- **Zero Bot Detection:** Runs through native `chrome.debugger` API inside your personal Chrome browser.
- **Full Session & Cookie Reuse:** Retains all active logins, 2FA, extensions, and hardware fingerprints.
- **Zero Dependencies:** Pure Node.js RFC 6455 WebSocket & CDP relay server (starts in <5ms).
- **Compatible with standard CDP:** Exposes standard `/json/version`, `/json/list`, and `/devtools/page/:id`.

## Quick Setup (1 minute)

### 1. Load Extension in Chrome
1. Open Google Chrome.
2. Go to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** (Tải tiện ích đã giải nén).
5. Select directory:
   ```
   <repo-root>/plugins/supergraph/extensions/chrome-relay
   ```

### 2. Start Local Relay Server
Run:
```bash
node plugins/supergraph/extensions/chrome-relay/relay-server.js
# Or
./plugins/supergraph/extensions/chrome-relay/bin/supergraph-relay
```

### 3. Connect Supergraph Browser Agent
Configure your agent or environment:
```bash
export SG_BROWSER_CDP="http://127.0.0.1:9333"
```
Or in `agent-browser`:
```bash
agent-browser connect http://127.0.0.1:9333
```
Now all AI browser actions happen directly in your active Chrome tabs!

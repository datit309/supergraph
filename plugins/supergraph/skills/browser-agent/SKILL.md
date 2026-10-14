---
name: browser-agent
description: Autonomous human-like browser control and E2E user-flow testing. Uses Supergraph Browser MCP to navigate, observe, click, type realistically, and verify web applications as a real human user.
mcp: supergraph-browser
---

# /supergraph:browser-agent

Autonomous human-like browser control and end-to-end user experience testing.

Announce: "🌐 /supergraph:browser-agent — controlling browser as real user..."

---

## When to Use

- Executing end-to-end tests by acting as an actual human user
- Navigating complex SPAs (React, Vue, Next.js) requiring user interactions
- Filling multi-step forms, testing auth flows, clicking modals/dropdowns
- Visually and structurally verifying page state without fragile selectors
- Automating web operations while minimizing bot-detection footprints

---

## Tools Available (`mcp__supergraph-browser__*`)

| Tool | Purpose | Best Practice |
|---|---|---|
| `browser_navigate` | Go to URL | Always follow with `browser_wait_for` or `browser_snapshot` |
| `browser_snapshot` | Read page state | **Primary vision tool**: compact accessibility tree, token-efficient |
| `browser_find` | Locate elements | Search snapshot by text/regex with context |
| `browser_click` | Click element | Use exact element ref from snapshot |
| `browser_type` | Type text | Use `slowly: true` for human typing cadence |
| `browser_fill_form` | Bulk fill inputs | Fills multiple inputs, checkboxes, dropdowns |
| `browser_press_key` | Keyboard actions | Enter, Tab, Escape, Arrow keys |
| `browser_wait_for` | Wait / delay | Wait for text or simulate natural human pause |
| `browser_take_screenshot` | Visual capture | Take viewport or full page screenshot |
| `browser_tabs` | Tab management | List, create, switch, close tabs |
| `browser_network_requests` | API inspection | Check network calls triggered by actions |

---

## The 4-Step Human Interaction Loop

```
[1. Navigate] ───> [2. Observe Snapshot] ───> [3. Human Action] ───> [4. Verify & Settle]
browser_navigate     browser_snapshot           browser_type (slowly)  browser_wait_for
                     browser_find               browser_click          browser_snapshot
```

### 1. Observe Before Acting (Never Blind Click)
Always call `browser_snapshot` first to get the current state and valid element references. Do not guess selectors.

### 2. Human Cadence & Anti-Detection
- Set `slowly: true` on `browser_type` so input triggers realistic `keydown`, `keypress`, `keyup` events.
- Insert small `browser_wait_for(time=1)` pauses between rapid sequential clicks.
- Use `browser_find` to verify target presence before clicking.

### 3. Bypassing Bot Detection / Login Walls
If target site enforces Cloudflare, Akamai, or strict CAPTCHA:
1. Launch real Google Chrome with remote debugging:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   ```
2. Set `SG_BROWSER_CDP=http://127.0.0.1:9222` to attach directly to the authenticated session.
3. The browser will use your real cookies, extensions, canvas fingerprints, and hardware profile.

---

## Example Flow

```typescript
// 1. Open site
await mcp__supergraph-browser__browser_navigate({ url: "http://127.0.0.1:3080" });

// 2. Read snapshot
const snapshot = await mcp__supergraph-browser__browser_snapshot();

// 3. Find input and type as human
await mcp__supergraph-browser__browser_type({
  target: 'input[placeholder="Search"]',
  text: 'Supergraph',
  slowly: true,
  submit: true
});

// 4. Verify result
await mcp__supergraph-browser__browser_wait_for({ text: "Results" });
```

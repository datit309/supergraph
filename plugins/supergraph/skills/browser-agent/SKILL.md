---
name: browser-agent
description: Autonomous human-like browser control and E2E user-flow testing. Powered by agent-browser (Rust native CDP, zero Playwright) with human input simulation, anti-bot bypass, and token-efficient snapshots.
mcp: supergraph-browser
---

# /supergraph:browser-agent

Autonomous human-like browser control and end-to-end user experience testing without Playwright.
Powered by native Rust `agent-browser` (Chrome DevTools Protocol direct, zero bot-detection footprint).

Announce: "🌐 /supergraph:browser-agent — controlling browser as real user (Rust CDP)..."

---

## Why Agent-Browser over Playwright?

- **Zero Bot Detection Footprint:** Native Rust client communicating directly via CDP. Removes `navigator.webdriver` and disables Blink automation flags.
- **Human Input Mode (`--input-mode human`):** Natural Bezier mouse curves, randomized typing cadence, natural dwell times.
- **Token Efficiency:** Compact Accessibility Tree snapshots with `@ref` identifiers (~100-300 tokens vs 20,000 HTML tokens).
- **Session & Profile Reuse:** Effortlessly attaches to your authenticated Chrome profile or `--auto-connect` to running Chrome on port 9222.

---

## Available Tools / Commands

Can be invoked via MCP (`mcp__supergraph-browser__*`) or CLI (`agent-browser`):

| Action | MCP Tool | CLI Command | Purpose |
|---|---|---|---|
| Open URL | `agent_browser_open` | `agent-browser open <url>` | Navigate to page |
| Read State | `agent_browser_snapshot` | `agent-browser snapshot -i` | Accessibility tree with `@ref` |
| Find Target | `agent_browser_find` | `agent-browser find role button click` | Locate elements semantically |
| Click | `agent_browser_click` | `agent-browser click @ref` | Click element by ref |
| Type/Fill | `agent_browser_fill` | `agent-browser fill @ref <text>` | Fill input with human keystrokes |
| Key Press | `agent_browser_press` | `agent-browser press Enter` | Send keyboard event |
| Wait | `agent_browser_wait_for_text` | `agent-browser wait <ms>` | Wait for condition or pause |
| Screenshot | `agent_browser_screenshot` | `agent-browser screenshot <path>` | Capture visual evidence |
| Close | `agent_browser_close` | `agent-browser close` | Close session |

---

## The 4-Step Human Interaction Loop

```
[1. Open] ───────> [2. Snapshot @refs] ───> [3. Human Action] ───> [4. Verify & Settle]
open <url>          snapshot -i               click @e2                 wait_for_text
                    find                      fill @e3 "text"           snapshot
```

### 1. Observe Before Acting (Never Guess Selectors)
Call `snapshot` to get verified element references (`@e1`, `@e2`, ...).

### 2. Bypassing Strict Bot Walls (Cloudflare, Akamai, CAPTCHA)
Connect directly to your active browser:
```bash
# Attach to existing Chrome
export SG_BROWSER_CDP="http://127.0.0.1:9222"
# Or auto-discover running Chrome instance
export SG_BROWSER_AUTO_CONNECT="true"
```
Uses your real user session, cookies, extensions, canvas fingerprints, and hardware profile.

---

## CLI Quick Examples (in bash)

```bash
agent-browser open https://example.com
agent-browser snapshot -i
agent-browser click @e1
agent-browser fill @e2 "user@example.com"
agent-browser screenshot verify.png
agent-browser close
```

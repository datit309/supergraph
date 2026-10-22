---
name: browser-agent
description: Autonomous human-like browser control and professional QA/QC testing. Powered by agent-browser (Rust native CDP, zero Playwright) with ISTQB test matrix generation, automated testcase execution, console/network error tracing, and defect reporting.
mcp: supergraph-browser
---

# /supergraph:browser-agent

Autonomous human-like browser control and professional QA/QC testcase execution without Playwright.
Powered by native Rust `agent-browser` (Chrome DevTools Protocol direct, zero bot-detection footprint).

Announce: "🌐 /supergraph:browser-agent — professional QA testing with real user emulation (Rust CDP)..."

---

## Why Agent-Browser over Playwright?

- **Zero Bot Detection Footprint:** Native Rust client communicating directly via CDP. Removes `navigator.webdriver` and disables Blink automation flags.
- **Human Input Mode (`--input-mode human`):** Natural Bezier mouse curves, randomized typing cadence, natural dwell times.
- **Token Efficiency:** Compact Accessibility Tree snapshots with `@ref` identifiers (~100-300 tokens vs 20,000 HTML tokens), supporting `--delta` for incremental updates.
- **Session & Profile Reuse:** Effortlessly attaches to your authenticated Chrome profile or `--auto-connect` to running Chrome on port 9222.
- **Native Audits & Vitals:** Embedded axe-core accessibility engine (WCAG 2.1 AA) and Core Web Vitals profiling without external test harnesses.

---

## Session Isolation for Multi-Agent Workflows (Supergraph Team)

> **CRITICAL RULE:** In multi-agent environments (Supergraph Team DAG, parallel workers), **never run without an isolated session**.
> The default unnamed session is shared globally across the machine. Unnamed sessions will hijack tabs, overwrite cookies, and crash concurrent worker tests.

Before running any test or browser action, establish an isolated session:

```bash
# Derive isolated session ID scoped to current worktree / task
export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix sg-task)"

# When connecting to shared Chrome (--cdp), ALWAYS pass --pin-tab
# to lock session to its dedicated tab and prevent tab hijacking
agent-browser --session "$AGENT_BROWSER_SESSION" --pin-tab open "$TARGET_URL"
```

For MCP tool calls: pass `session: AGENT_BROWSER_SESSION` or use `pinTab: true` with `agent_browser_connect`.

---

## Available Tools / Commands

Can be invoked via MCP (`mcp__supergraph-browser__*`) or CLI (`agent-browser`):

| Action | MCP Tool | CLI Command | Purpose |
|---|---|---|---|
| Open URL | `agent_browser_open` | `agent-browser open <url>` | Navigate to page (checks WebMCP) |
| Read State | `agent_browser_snapshot` | `agent-browser snapshot -i` | Accessibility tree with `@ref` |
| Delta Snapshot | `agent_browser_snapshot` | `agent-browser snapshot -i --delta` | Compact incremental changes only |
| Find Target | `agent_browser_find` | `agent-browser find role button click` | Locate elements semantically |
| Click | `agent_browser_click` | `agent-browser click @ref` | Click element by ref |
| Type/Fill | `agent_browser_fill` | `agent-browser fill @ref <text>` | Fill input with human keystrokes |
| Key Press | `agent_browser_press` | `agent-browser press Enter` | Send keyboard event |
| Wait | `agent_browser_wait_for_text` | `agent-browser wait --text <text>` | Wait for condition (no bare sleep) |
| Screenshot | `agent_browser_screenshot` | `agent-browser screenshot <path>` | Capture visual evidence |
| If-Changed Capture | `agent_browser_screenshot` | `agent-browser screenshot --if-changed` | Skip unchanged pixels to save tokens |
| Video Repro Start | `agent_browser_record_start` | `agent-browser record start <path>.webm --cursor` | Record video with pointer overlay |
| Video Repro Stop | `agent_browser_record_stop` | `agent-browser record stop` | Stop video recording |
| Accessibility Audit | `agent_browser_a11y` | `agent-browser a11y --tags wcag2a,wcag2aa` | axe-core WCAG 2.1 AA audit |
| Web Vitals | `agent_browser_vitals` | `agent-browser vitals --json` | LCP, CLS, TTFB & React hydration |
| Console Logs | `agent_browser_console` | `agent-browser console` | View browser console logs |
| Page Errors | `agent_browser_errors` | `agent-browser errors` | Catch unhandled exceptions |
| Network Requests | `agent_browser_network_requests` | `agent-browser network requests` | Inspect network traffic & failures |
| Network Mock | `agent_browser_network_route` | `agent-browser network route <pattern> --abort` | Mock 500 / fault injection |
| Visual Diff | `agent_browser_diff_screenshot` | `agent-browser diff screenshot <baseline>` | Compare pixel regression |
| Viewport Size | `agent_browser_set_viewport` | `agent-browser set viewport 375 812` | Mobile/responsive emulation |
| Media / Theme | `agent_browser_set_media` | `agent-browser set media --color-scheme dark` | Dark mode & reduced motion |
| React Tree | `agent_browser_react_tree` | `agent-browser react tree` | React component tree (DevTools) |
| WebMCP List | `agent_browser_webmcp_list` | `agent-browser webmcp list --json` | Discover page-provided tools |
| WebMCP Invoke | `agent_browser_webmcp_invoke` | `agent-browser webmcp invoke <tool>` | Call page tool directly |
| Close Session | `agent_browser_close` | `agent-browser close` | Terminate session & free resources |

---

## WebMCP-First Core Loop

When opening a page, check if the application exposes WebMCP tools before attempting manual DOM interaction:

```
[1. Open Page] ────> [2. WebMCP Available?] ──┬──> (Yes) ──> [Invoke WebMCP Tool directly]
                       webmcp list --json     │               webmcp invoke <tool> --params '{...}'
                                              └──> (No)  ──> [Fallback: Snapshot & DOM Actions]
                                                              snapshot -i ──> click/fill @ref
```

If a relevant WebMCP tool exists matching the test case (e.g., `create_item`, `checkout`), invoke it directly. This avoids brittle DOM selectors and tests the application's native agentic API interface.

---

## Token-Efficient DOM Interaction Loop

```
[1. Open] ───────> [2. Initial Snapshot] ───> [3. Action] ──────────> [4. Delta Snapshot]
open <url>          snapshot -i -c             click @e2 / fill @e3    snapshot -i --delta
```

### 1. Observe Before Acting (Never Guess Selectors)
Call `snapshot -i -c` (interactive + compact) to get verified element references (`@e1`, `@e2`, ...).
For subsequent actions on the same page, always use `snapshot -i --delta` to capture only altered nodes, saving ~80% context tokens.
When testing an isolated component, scope the snapshot: `agent-browser snapshot -i -s "#checkout-modal"`.

### 2. Wait Best Practices (Zero Flaky Tests)
- **Do:** Wait for specific elements: `wait @ref` or `wait --text "Submission Complete"`.
- **Do:** Wait for URL transitions: `wait --url "**/dashboard"`.
- **Do:** Wait for JavaScript conditions: `wait --fn "window.__APP_READY__ === true"`.
- **Avoid:** `wait --load networkidle` on applications with SSE, WebSockets, or polling — it will hang until timeout (25s).
- **Avoid:** Arbitrary hardcoded delays (`sleep 2000` / `wait 2000`) except when pacing actions during video recording.

---

## Bypassing Strict Bot Walls (Cloudflare, Akamai, CAPTCHA)

Connect directly to your active browser using either method:

**Method A: Supergraph Chrome Relay Extension (Zero restart, 100% human profile)**
```bash
# 1. Start relay server
node plugins/supergraph/extensions/chrome-relay/relay-server.js
# 2. Attach agent
export SG_BROWSER_CDP="http://127.0.0.1:9333"
```

**Method B: Chrome Remote Debugging Port**
```bash
# Attach to existing Chrome
export SG_BROWSER_CDP="http://127.0.0.1:9222"
# Or auto-discover running Chrome instance
export SG_BROWSER_AUTO_CONNECT="true"
```
Uses your real user session, cookies, extensions, canvas fingerprints, and hardware profile.

---

## Professional QA/Tester Workflow (ISTQB Standard)

When tasked with testing a feature or application, the agent acts as a Senior QA Automation Engineer:

### Phase 0: Graph Context & Impact Prioritization
Query codebase graph to prioritize coverage on changed paths:
Use `CBM_PROJECT`: call `detect_changes`, `search_graph` for changed routes/pages, then `trace_path` for inbound/outbound call and data-flow paths. Run validated `test-gaps` recipes. If results are unavailable, fall back to filesystem inspection.

### Phase 1: Test Matrix Generation
Generate a comprehensive test matrix covering 7 dimensions and save to `docs/qa/test-matrix-<feature>.md` (scaffold quickly with `scripts/init-qa.sh matrix <feature> [ui|api|fullstack] [target-url]`):
1. **Happy Path:** Expected valid user flow / 200 OK API contract from entrance to success.
2. **Negative Path:** Missing required fields, invalid credentials, malformed emails/JSON, schema violations.
3. **Boundary Value Analysis:** 0 chars, 1 char, limit max chars, SQLi/XSS probe strings (`<script>`, `' OR 1=1`).
4. **Network & Fault Resilience:** Simulating 500 API errors, timeout, offline state (`network route <url> --abort`).
5. **RBAC & Authorization:** Guest/User attempting to access restricted routes or perform unauthorized operations (401/403/IDOR).
6. **Accessibility (WCAG 2.1 AA):** 0 serious axe-core violations on critical paths.
7. **Responsive & Mobile Viewport:** Verification at 375x812 (iPhone/Mobile) ensuring no horizontal overflow or hidden CTA.

### Phase 2: Autonomous Execution & Verification
For each testcase in the matrix:
1. Navigate with session: `agent-browser --session "$AGENT_BROWSER_SESSION" open <url>`.
2. Input test data with human cadence: `agent-browser --session "$AGENT_BROWSER_SESSION" fill @ref <data>`.
3. Trigger action: `agent-browser --session "$AGENT_BROWSER_SESSION" click @ref`.
4. Assert outcome:
   - Check URL transition: `agent-browser --session "$AGENT_BROWSER_SESSION" get url`
   - Check UI feedback: `agent-browser --session "$AGENT_BROWSER_SESSION" is visible <selector>` or `agent-browser --session "$AGENT_BROWSER_SESSION" get text @ref`
   - Re-snapshot with delta: `agent-browser --session "$AGENT_BROWSER_SESSION" snapshot -i --delta`

### Phase 3: Console, Errors, Network & Web Vitals Diagnostics
Assert that no silent runtime bugs were introduced:
- `agent-browser --session "$AGENT_BROWSER_SESSION" console --clear` → Detect React hydration warnings, runtime `console.error`.
- `agent-browser --session "$AGENT_BROWSER_SESSION" errors` → Unhandled Promise rejections.
- `agent-browser --session "$AGENT_BROWSER_SESSION" network requests` → Identify failed HTTP 4xx/500 endpoints.
- `agent-browser --session "$AGENT_BROWSER_SESSION" vitals --json` → Assert LCP < 2.5s, CLS < 0.1, TTFB < 800ms.

### Phase 4: Accessibility Verification (axe-core)
Run embedded accessibility audit on key interactive views:
```bash
agent-browser --session "$AGENT_BROWSER_SESSION" a11y --tags wcag2a,wcag2aa --json
```
Ensure 0 critical/serious violations (color contrast, missing accessible names on buttons/inputs, keyboard traps).

### Phase 5: Structured Defect Reporting with Repro Evidence
If defects are found, generate a formal Bug Report at `docs/qa/bug-report-<timestamp>.md` (scaffold quickly with `scripts/init-qa.sh bug <feature> <defect-id> <defect-title>`):
- **Defect ID & Title:** e.g., `BUG-AUTH-001: Missing password validation triggers unhandled 500 error`.
- **Severity & Priority:** Blocker / Critical / Major / Minor.
- **Categorize Evidence:**
  - **Static / Visual Defects (typos, layout shift on load):** Single annotated screenshot:
    ```bash
    agent-browser --session "$AGENT_BROWSER_SESSION" screenshot --annotate docs/qa/evidence/<defect-id>.png
    ```
  - **Interactive / Behavioral Defects (state bugs, failed submissions, modal traps):** Full `.webm` video recording with cursor overlay and contact sheet:
    ```bash
    agent-browser --session "$AGENT_BROWSER_SESSION" record start docs/qa/evidence/<defect-id>-repro.webm --cursor --contact-sheet
    # Walk through repro steps at human pace with 1s pauses
    agent-browser --session "$AGENT_BROWSER_SESSION" record stop
    ```
- **Diagnostics Dump:** Attach `console`, `errors`, and failing HTTP response bodies directly into the report.

---

## CLI Quick Examples (in bash)

```bash
# 1. Establish isolated session
export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix test)"

# 2. Open and inspect
agent-browser --session "$AGENT_BROWSER_SESSION" open http://localhost:3000
agent-browser --session "$AGENT_BROWSER_SESSION" snapshot -i -c

# 3. Interact with refs
agent-browser --session "$AGENT_BROWSER_SESSION" fill @e1 "user@example.com"
agent-browser --session "$AGENT_BROWSER_SESSION" click @e2
agent-browser --session "$AGENT_BROWSER_SESSION" wait --url "**/dashboard"

# 4. Audit A11y & Vitals
agent-browser --session "$AGENT_BROWSER_SESSION" a11y --tags wcag2a,wcag2aa
agent-browser --session "$AGENT_BROWSER_SESSION" vitals

# 5. Capture & Clean up
agent-browser --session "$AGENT_BROWSER_SESSION" screenshot --if-changed docs/qa/evidence/verify.png
agent-browser --session "$AGENT_BROWSER_SESSION" close
```

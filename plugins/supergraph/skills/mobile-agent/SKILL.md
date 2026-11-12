---
name: mobile-agent
description: Test mobile apps using connected iOS WebDriverAgent or Android UiAutomator2 backends. Verify MCP availability, device selection and driver readiness before actions; collect snapshots and evidence without claiming unexecuted tests passed.
mcp: supergraph-wda, supergraph-uiautomator2
---

# /supergraph:mobile-agent

One skill, two independent backends: **WebDriverAgent** (iOS) and **UiAutomator2** (Android). This is an agent procedure, not an automatic device provisioning service. In DSH invoke `/mobile-agent`; in Claude Code use `/supergraph:mobile-agent`.

## 1. Preflight — do not skip

1. Inspect the host's available MCP tools. Required: `wda_status`, `wda_session_start`, `wda_snapshot`, `wda_tap` for iOS; `uiauto_status`, `uiauto_session_start`, `uiauto_snapshot`, `uiauto_tap` for Android.
2. If tools are missing, STOP execution and report **BLOCKED: MCP backend not loaded**. Skill frontmatter does not install or start MCP servers. Configure the relevant stdio entry from the installed plugin's absolute directory:
   - iOS: `node <absolute-plugin-dir>/bin/sg-wda-mcp.js`
   - Android: `node <absolute-plugin-dir>/bin/sg-uiautomator2-mcp.js`
   Restart/reconnect the host MCP connection and verify `tools/list`. Do not invent tools or say a shell probe is a completed UI test.
3. Ask for platform, app identifier, target device and test flow if absent. Discover using `wda_device_list` / `uiauto_device_list` only when that backend is available.
4. Select ONE target. Multiple USB devices do not imply isolated sessions. These servers hold one mutable session and reference map per process. Never run concurrent flows against one server instance. For multiple devices use separately configured server processes and unique forwarded ports.
5. Verify health using the selected platform's status tool. Device discovery alone does not prove WDA/instrumentation is running. Record backend URL, selected device and status result. Keep device identifiers out of public reports.

## 2. Prepare the native driver

The operator must install platform SDKs and native runner. Do not install APKs, change signing, grant permissions or launch arbitrary apps without authorization.

### iOS

Requires macOS/Xcode, a trusted unlocked device with Developer Mode, and a signed WebDriverAgentRunner built for that target. Obtain WDA from https://github.com/appium/WebDriverAgent and follow its current signing/build instructions. Start the runner in Xcode. For USB forwarding with current libusbmuxd:

```bash
iproxy -u "$IOS_UDID" 8100 8100
curl --fail --max-time 5 http://127.0.0.1:8100/status
```

Check `iproxy --help` for the installed CLI version. A booted Simulator can expose WDA locally without USB forwarding. Set `WDA_URL` on the MCP process if not using port 8100.

### Android

Requires Android platform-tools, USB debugging authorized on the selected device, and matching server and test APKs from https://github.com/appium/appium-uiautomator2-server. Use release-matched APKs; do not guess download names or install unrelated builds.

```bash
adb devices -l
adb -s "$ANDROID_SERIAL" install -r "$UIA_SERVER_APK"
adb -s "$ANDROID_SERIAL" install -r "$UIA_TEST_APK"
adb -s "$ANDROID_SERIAL" forward tcp:6790 tcp:6790
adb -s "$ANDROID_SERIAL" shell am instrument -w io.appium.uiautomator2.server.test/androidx.test.runner.AndroidJUnitRunner
```

Keep instrumentation running; verify `/status` from another terminal. Direct UiAutomator2 routes and payloads differ from the public Appium server API. Set `UIAUTOMATOR2_URL` on the MCP process for a different forwarded port. Driver/app lifecycle operations may require platform-specific setup; do not assume creating a session installed or launched the app.

Optional environment inventory (not a readiness or E2E gate):

```bash
bash plugins/supergraph/skills/mobile-agent/scripts/init-mobile-qa.sh doctor
```

The existing helper is informational: its exit code alone is not proof of a healthy driver. Validate the selected status tool and a real snapshot separately.

## 3. Observe → act → assert

Read the actual `tools/list` input schema before calling tools. Examples below are JSON arguments, not shell commands.

- iOS: `wda_session_start` with `{"bundle_id":"com.example.app"}`.
- Android: `uiauto_session_start` with `{"package_name":"com.example.app"}`.
- Snapshot: `wda_snapshot` or `uiauto_snapshot` with `{}`.
- Tap: platform tap with `{"ref":"@e1"}` after inspecting that ref in the current snapshot.
- Fill: platform fill with `{"ref":"@e2","text":"test value"}`. Android replaces existing input; WDA currently appends and does not clear existing text. Do not assume parity or retry typing blindly. Never put production passwords, OTPs or tokens into reports.
- Follow each action with a snapshot and explicit expected-state assertion. `delta: true` is an optimization, not a substitute for assertions. Refresh after navigation, session restart, dynamic list changes or stale-ref errors. Repeated resource IDs/names are ambiguous: their refs are invalidated on the next snapshot rather than silently redirected to another row. Never retry a stale ref blindly.
- Use `wda_wait` / `uiauto_wait` with schema-supported arguments and a bounded timeout. A timeout is a failed assertion, not success.
- Take screenshots via `wda_screenshot` / `uiauto_screenshot` using the schema's path parameter; record the actual returned path. Do not claim a screenshot was saved unless the tool succeeded.
- Keyboard: `wda_dismiss_keyboard` for iOS. Direct UiAutomator2 does not expose the middleware hide-keyboard operation: `uiauto_hide_keyboard` reports unsupported. An explicit Android Back key (`uiauto_press_keycode`) may close the keyboard but can navigate away when no keyboard is open; inspect before and after.
- Permission prompts: `wda_handle_alert` / `uiauto_handle_alert` only for test-approved permissions. Do not auto-accept security, purchase, account or data-deletion prompts.
- Cleanup: stop the session in a finally-style cleanup step. Report cleanup errors without overwriting the original failure.

## Available MCP tools

**iOS:** `wda_status`, `wda_device_list`, `wda_session_start`, `wda_session_stop`, `wda_snapshot`, `wda_tap`, `wda_fill`, `wda_type`, `wda_press_button`, `wda_dismiss_keyboard`, `wda_swipe`, `wda_wait`, `wda_screenshot`, `wda_app_lifecycle`, `wda_handle_alert`, `wda_open_url`.

**Android:** `uiauto_status`, `uiauto_device_list`, `uiauto_session_start`, `uiauto_session_stop`, `uiauto_snapshot`, `uiauto_tap`, `uiauto_fill`, `uiauto_press_keycode`, `uiauto_hide_keyboard`, `uiauto_swipe`, `uiauto_wait`, `uiauto_screenshot`, `uiauto_app_lifecycle`, `uiauto_handle_alert`, `uiauto_open_url`.

Availability is host-dependent; listing a tool here does not mean it is loaded or supported by the installed native server version. The direct Android backend explicitly rejects middleware-only `uiauto_hide_keyboard`, app activation/termination through `uiauto_app_lifecycle`, and `uiauto_open_url`; use separately authorized ADB operations or full Appium when those are required. Treat unsupported-route errors as BLOCKED and include driver version and exact route, not speculative retries.

## 4. QA evidence

Scaffold a 7-dimension matrix and defect report:

```bash
bash plugins/supergraph/skills/mobile-agent/scripts/init-mobile-qa.sh matrix login com.example.app Android
bash plugins/supergraph/skills/mobile-agent/scripts/init-mobile-qa.sh bug login MOB-BUG-001 "Login button does not respond" Android
```

Use test data. Cover happy/negative/boundary cases, keyboard, rotation/safe area, permissions and interrupted app state as applicable. Do not change device connectivity or delete data without authorization.

Report each case as **PASS**, **FAIL**, **BLOCKED** or **NOT RUN**, with expected/observed state and evidence path. Separate parser/unit tests, HTTP contract tests and actual device E2E results. Missing hardware, missing tools, unreachable runner or incompatible endpoints means device tests are BLOCKED, even if unit tests pass. No fixed speed/token-reduction percentages are promised without measurements.

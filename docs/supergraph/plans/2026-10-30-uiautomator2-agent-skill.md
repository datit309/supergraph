# Plan: Tích hợp bộ Skill & MCP Tool uiautomator2-agent (Android UiAutomator2 Server) vào Supergraph

> **Mục tiêu:** Xây dựng hoàn chỉnh bộ **Skill & MCP Server `uiautomator2-agent`** trong Supergraph dựa trên **Appium UiAutomator2 Server**. Cùng với `wda-agent` (iOS), tạo thành bộ đôi hoàn chỉnh cho phép AI Agent tự động điều khiển, kiểm thử UI/E2E thực tế trên **thiết bị Android thật (Samsung, Xiaomi, Pixel, Oppo...) và Android Emulator** khi code Mobile (Flutter, React Native, Android Kotlin/Java).

---

## 1. Kiến trúc & Hợp đồng (Architecture & Contracts)

### 1.1. Core UiAutomator2 Engine (`plugins/supergraph/src/uiautomator2/`)
Giao tiếp HTTP REST trực tiếp với UiAutomator2 Server (port 6790 qua `adb forward tcp:6790 tcp:6790`) — **không cần cài đặt Appium Server**:
- `client.js`: HTTP client thực thi các endpoint W3C WebDriver của UiAutomator2 (session, tap, fill, swipe, screenshot, alert, keycode, lifecycle).
- `parser.js`: **Compact Android A11y Tree Parser** — chuẩn hoá các class `android.widget.*` (`Button`, `EditText` -> `TextField`, `TextView` -> `StaticText`), nén từ 20.000 tokens XML/JSON xuống 200–400 tokens có đánh số `@ref` (`@e1`, `@e2`...), tính toạ độ center và hỗ trợ snapshot delta.
- `tunnel.js`: Quản lý phát hiện thiết bị Android qua `adb devices`, tự động thiết lập `adb forward tcp:6790 tcp:6790`, kiểm tra trạng thái instrumentation.
- `mcp-server.js`: MCP Server chuẩn JSON-RPC 2.0 stdio expose 16 tools cho AI Agent.

### 1.2. MCP Binary (`plugins/supergraph/bin/sg-uiautomator2-mcp.js`)
- Executable binary khởi chạy `UiAutomator2McpServer`.
- Đăng ký vào `package.json` (`"sg-uiautomator2-mcp": "./bin/sg-uiautomator2-mcp.js"`).
- Đăng ký vào `.mcp.json` (`"supergraph-uiautomator2": { "command": "node", "args": ["bin/sg-uiautomator2-mcp.js"] }`).

### 1.3. Supergraph Skill (`plugins/supergraph/skills/uiautomator2-agent/`)
- `SKILL.md`: Đặc tả skill chuẩn Supergraph:
  - Hướng dẫn setup USB Debugging trên Android thật (Developer Options).
  - Hướng dẫn cài đặt 2 file APK server (`appium-uiautomator2-server.apk` & `test.apk`) và lệnh `adb forward`.
  - Vòng lặp tương tác tiết kiệm token: `[Launch] -> [Snapshot -c] -> [Tap/Fill @ref] -> [Assert & Delta]`.
  - Ma trận kiểm thử Mobile 7 chiều theo chuẩn ISTQB cho Android (Back button, Keyboard, Permissions, Notification shade).
- `templates/test-matrix-android-template.md`: Template ma trận kiểm thử Android.
- `templates/android-bug-report-template.md`: Template báo cáo lỗi trên máy Android kèm Logcat và screenshot.
- `scripts/init-android-qa.sh`: Script scaffold nhanh ma trận hoặc bug report, kèm lệnh `doctor` kiểm tra kết nối ADB.

### 1.4. Pipeline & DSH Integration
- Cập nhật `AGENTS.md` và `CLAUDE.md`: Bổ sung `/uiautomator2-agent` vào danh mục Skills và Step 5.
- Tạo symlink `~/.dsh/skills/uiautomator2-agent` để DSH nhận diện ngay lập tức.

---

## 2. Các Task Thực Thi (Wave DAG)

### Wave 1: Core Android Tree Parser & Client with TDD
- **Task ID**: `task-1-uiautomator2-client-and-parser`
- **Status**: completed
- **Files**:
  - `plugins/supergraph/src/uiautomator2/client.js`
  - `plugins/supergraph/src/uiautomator2/parser.js`
  - `plugins/supergraph/tests/test-uiautomator2-tree-parser.mjs`
- **Acceptance Criteria**:
  - `UiAutomator2TreeParser` chuyển đổi các class Android (`android.widget.Button`, `EditText`, `TextView`) thành dạng compact text có nhãn `@ref`.
  - Tính chính xác toạ độ trung tâm `(x, y)` từ bounds `[x1, y1][x2, y2]`.
  - Hỗ trợ snapshot `--delta` phát hiện thêm/bớt/sửa element.
  - TDD test `test-uiautomator2-tree-parser.mjs` pass 100%.

### Wave 2: MCP Server & ADB Tunnel with TDD
- **Task ID**: `task-2-uiautomator2-mcp-server`
- **Status**: completed
- **Files**:
  - `plugins/supergraph/src/uiautomator2/tunnel.js`
  - `plugins/supergraph/src/uiautomator2/mcp-server.js`
  - `plugins/supergraph/bin/sg-uiautomator2-mcp.js`
  - `plugins/supergraph/tests/test-sg-uiautomator2-mcp.mjs`
- **Acceptance Criteria**:
  - MCP Server phản hồi đúng chuẩn JSON-RPC 2.0 (initialize, tools/list, tools/call).
  - Expose đầy đủ 16 tools (`uiauto_status`, `uiauto_device_list`, `uiauto_session_start`, `uiauto_snapshot`, `uiauto_tap`, `uiauto_fill`, `uiauto_screenshot`, `uiauto_press_keycode`, etc.).
  - Giả lập mock HTTP server UiAutomator2 (port 16790) để kiểm tra tool execution.
  - TDD test `test-sg-uiautomator2-mcp.mjs` pass 100%.

### Wave 3: Skill Definition, Templates & Scaffolding Scripts
- **Task ID**: `task-3-uiautomator2-agent-skill`
- **Status**: completed
- **Files**:
  - `plugins/supergraph/skills/uiautomator2-agent/SKILL.md`
  - `plugins/supergraph/skills/uiautomator2-agent/templates/test-matrix-android-template.md`
  - `plugins/supergraph/skills/uiautomator2-agent/templates/android-bug-report-template.md`
  - `plugins/supergraph/skills/uiautomator2-agent/scripts/init-android-qa.sh`
  - `plugins/supergraph/tests/test-uiautomator2-agent-skill.mjs`
- **Acceptance Criteria**:
  - `SKILL.md` đầy đủ hướng dẫn USB Debugging, `adb forward`, core loop, Android QA ISTQB matrix, handling alerts.
  - Script `init-android-qa.sh` có quyền thực thi (`chmod +x`).
  - Test `test-uiautomator2-agent-skill.mjs` xác thực tính toàn vẹn của skill.

### Wave 4: Supergraph System Registration & Symlink
- **Task ID**: `task-4-system-registration`
- **Status**: completed
- **Files**:
  - `plugins/supergraph/package.json`
  - `package.json`
  - `plugins/supergraph/.mcp.json`
  - `AGENTS.md`
  - `CLAUDE.md`
  - `~/.dsh/skills/uiautomator2-agent` (symlink)
- **Acceptance Criteria**:
  - `package.json` khai báo binary `sg-uiautomator2-mcp`.
  - `.mcp.json` có mục `supergraph-uiautomator2`.
  - `AGENTS.md` cập nhật danh mục skill và quy trình Step 5.
  - Chạy `npm test` trong `plugins/supergraph` đạt 100% pass toàn bộ test suites.

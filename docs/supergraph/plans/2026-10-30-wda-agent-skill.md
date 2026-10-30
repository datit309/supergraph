# Plan: Tích hợp bộ Skill & MCP Tool wda-agent (WebDriverAgent) vào Supergraph

> **Mục tiêu:** Xây dựng hoàn chỉnh bộ **Skill & MCP Server `wda-agent`** trong Supergraph dựa trên **WebDriverAgent (Appium WDA)**. Cho phép AI Agent tự động điều khiển, kiểm thử UI/E2E thực tế trên **thiết bị iOS thật (Real iPhone/iPad)** và Simulator khi lập trình mobile (Flutter, React Native, Swift iOS Native).

---

## 1. Kiến trúc & Hợp đồng (Architecture & Contracts)

### 1.1. Core WDA Engine (`plugins/supergraph/src/wda/`)
Giao tiếp HTTP REST trực tiếp với WDA server (port 8100 qua USB tunnel `iproxy` hoặc Wi-Fi) — **không cần cài đặt Appium Server**:
- `client.js`: HTTP client thực thi các endpoint WDA (session, tap, fill, swipe, screenshot, alert, lifecycle).
- `parser.js`: **Compact Accessibility Tree Parser** — nén cây UI từ 30.000 tokens XML xuống 200–400 tokens dạng text có đánh số `@ref` (`@e1`, `@e2`...), tính toạ độ center và hỗ trợ snapshot delta.
- `tunnel.js`: Quản lý phát hiện thiết bị iOS cắm qua USB và thiết lập port forwarding qua `iproxy` / `usbmuxd`.
- `mcp-server.js`: MCP Server chuẩn JSON-RPC 2.0 stdio expose các tool cho AI Agent.

### 1.2. MCP Binary (`plugins/supergraph/bin/sg-wda-mcp.js`)
- Executable binary khởi chạy `WdaMcpServer`.
- Đăng ký vào `package.json` (`"sg-wda-mcp": "./bin/sg-wda-mcp.js"`).
- Đăng ký vào `.mcp.json` (`"supergraph-wda": { "command": "node", "args": ["bin/sg-wda-mcp.js"] }`).

### 1.3. Supergraph Skill (`plugins/supergraph/skills/wda-agent/`)
- `SKILL.md`: Đặc tả skill chuẩn Supergraph:
  - Hướng dẫn setup Signing & Provisioning Profile cho `WebDriverAgentRunner`.
  - Hướng dẫn kết nối thiết bị thật qua USB.
  - Vòng lặp tương tác tiết kiệm token: `[Launch] -> [Snapshot -c] -> [Tap/Fill @ref] -> [Assert & Delta]`.
  - Ma trận kiểm thử Mobile 7 chiều theo chuẩn ISTQB.
  - Quy trình xử lý dialog quyền hệ thống (Camera, GPS, Notification).
- `templates/test-matrix-mobile-template.md`: Template ma trận kiểm thử mobile.
- `templates/mobile-bug-report-template.md`: Template báo cáo lỗi trên máy thật kèm device metadata và screenshot.
- `scripts/init-mobile-qa.sh`: Script scaffold nhanh ma trận hoặc bug report.

### 1.4. Pipeline & DSH Integration
- Cập nhật `AGENTS.md` và `CLAUDE.md`: Bổ sung `/wda-agent` vào danh mục Skills và Step 5 (Integration & E2E cho Mobile).
- Tạo symlink `~/.dsh/skills/wda-agent` để DSH nhận diện ngay lập tức.

---

## 2. Các Task Thực Thi (Wave DAG)

### Wave 1: Core Parser & WDA Client with TDD
- **Task ID**: `task-1-wda-client-and-parser`
- **Status**: completed
- **Files**:
  - `plugins/supergraph/src/wda/client.js`
  - `plugins/supergraph/src/wda/parser.js`
  - `plugins/supergraph/tests/test-wda-tree-parser.mjs`
- **Acceptance Criteria**:
  - `WdaTreeParser` nén thành công cây A11y XML/JSON thành compact text có nhãn `@ref`.
  - Tính chính xác toạ độ trung tâm `(x, y)` từ bounding box.
  - Hỗ trợ snapshot `--delta` phát hiện thêm/bớt/sửa element.
  - TDD test `test-wda-tree-parser.mjs` pass 100%.

### Wave 2: MCP Server & USB Tunnel with TDD
- **Task ID**: `task-2-wda-mcp-server`
- **Status**: completed
- **Files**:
  - `plugins/supergraph/src/wda/tunnel.js`
  - `plugins/supergraph/src/wda/mcp-server.js`
  - `plugins/supergraph/bin/sg-wda-mcp.js`
  - `plugins/supergraph/tests/test-sg-wda-mcp.mjs`
- **Acceptance Criteria**:
  - MCP Server phản hồi đúng chuẩn JSON-RPC 2.0 (initialize, tools/list, tools/call).
  - Expose đầy đủ 16 tools (`wda_status`, `wda_device_list`, `wda_session_start`, `wda_snapshot`, `wda_tap`, `wda_fill`, `wda_screenshot`, etc.).
  - Giả lập mock HTTP server WDA để kiểm tra tool execution.
  - TDD test `test-sg-wda-mcp.mjs` pass 100%.

### Wave 3: Skill Definition, Templates & Scaffolding Scripts
- **Task ID**: `task-3-wda-agent-skill`
- **Status**: completed
- **Files**:
  - `plugins/supergraph/skills/wda-agent/SKILL.md`
  - `plugins/supergraph/skills/wda-agent/templates/test-matrix-mobile-template.md`
  - `plugins/supergraph/skills/wda-agent/templates/mobile-bug-report-template.md`
  - `plugins/supergraph/skills/wda-agent/scripts/init-mobile-qa.sh`
  - `plugins/supergraph/tests/test-wda-agent-skill.mjs`
- **Acceptance Criteria**:
  - `SKILL.md` đầy đủ hướng dẫn signing, USB, core loop, mobile QA ISTQB matrix, handling alerts.
  - Scripts `init-mobile-qa.sh` có quyền thực thi (`chmod +x`).
  - Test `test-wda-agent-skill.mjs` xác thực tính toàn vẹn của skill.

### Wave 4: Supergraph System Registration & Symlink
- **Task ID**: `task-4-system-registration`
- **Status**: completed
- **Files**:
  - `plugins/supergraph/package.json`
  - `package.json`
  - `plugins/supergraph/.mcp.json`
  - `AGENTS.md`
  - `CLAUDE.md`
  - `~/.dsh/skills/wda-agent` (symlink)
- **Acceptance Criteria**:
  - `package.json` khai báo binary `sg-wda-mcp`.
  - `.mcp.json` có mục `supergraph-wda`.
  - `AGENTS.md` cập nhật danh mục skill và quy trình Step 5.
  - Chạy `npm test` trong `plugins/supergraph` đạt 100% pass toàn bộ test suites.

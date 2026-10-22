# Plan: Cải tiến Skill browser-agent (Native Rust CDP & ISTQB QA Engine)

> Date: 2026-10-22
> Author: Supergraph Core Engineer
> Objective: Nâng cấp toàn diện skill `browser-agent`, templates ma trận kiểm thử ISTQB và script khởi tạo `init-qa.sh` nhằm khắc phục xung đột session giữa các agent worker song song, sửa bảng công cụ MCP, hỗ trợ WebMCP, kiểm thử tự động Accessibility (axe-core WCAG 2.1 AA), đo lường Web Vitals / React Hydration và quay video bằng chứng tái hiện lỗi (repro video).

---

## Architecture & Contracts

### 1. Session Isolation Invariant
Mọi lệnh thực thi `agent-browser` hoặc công cụ MCP `agent_browser_*` trong môi trường Supergraph Team (đa worker, song song trên Git Worktree) **bắt buộc** phải sử dụng session định danh cô lập:
```bash
export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix sg-task)"
```
Khi dùng chung CDP port (`--cdp`): phải kích hoạt `--pin-tab` để session gắn chặt vào tab riêng, tránh cướp tab của worker khác.

### 2. WebMCP First Discovery Contract
Khi mở URL, agent kiểm tra danh mục WebMCP trước khi thao tác DOM:
- Nếu trang web expose tool phù hợp mục tiêu kiểm thử: gọi trực tiếp qua `webmcp list` / `webmcp invoke`.
- Nếu không có WebMCP: chuyển sang tương tác DOM qua `snapshot -i`.

### 3. Token Efficiency Invariant
- Sử dụng `snapshot -i --delta` sau thao tác đầu tiên để chỉ nhận phần thay đổi, giảm ~80% context tokens.
- Sử dụng `screenshot --if-changed` để bỏ qua ảnh trùng lặp.
- Sử dụng `-s "<css-selector>"` khi cần scope vào component cụ thể.

### 4. Non-Functional Verification Standards
- **Accessibility:** 0 vi phạm nghiêm trọng chuẩn WCAG 2.1 AA (`agent-browser a11y --tags wcag2a,wcag2aa`).
- **Web Vitals:** LCP < 2.5s, CLS < 0.1, TTFB < 800ms, 0 cảnh báo React Hydration Mismatch (`agent-browser vitals`).
- **Evidence:** Defect tương tác (interactive/behavioral) bắt buộc có video `.webm` (`agent-browser record start ... --cursor --contact-sheet`). Defect tĩnh (static/layout) dùng ảnh chụp annotate.

---

## Environment Context
- **Language / Runtime:** Node.js (ESM) / Bash
- **Test Command:** `node --test plugins/supergraph/tests/*.mjs`
- **Lint Command:** `bash -n plugins/supergraph/skills/browser-agent/scripts/init-qa.sh`
- **Branch:** `master`
- **MCP Servers:** `supergraph-browser`, `codebase-memory`, `serena`, `supergraph-team`

---

## Task 1: Overhaul browser-agent SKILL.md specification
Wave: 1
Status: pending
Risk: medium
Dependencies: none
Model: inherit

Files:
- Modify: plugins/supergraph/skills/browser-agent/SKILL.md
- Test: plugins/supergraph/tests/test-browser-agent-skill.mjs

Blast radius:
- plugins/supergraph/skills/browser-agent/SKILL.md
- plugins/supergraph/skills/integration/SKILL.md

Acceptance:
- Bảng Available Tools map chính xác các typed MCP tools (`agent_browser_console`, `agent_browser_errors`, `agent_browser_network_requests`, `agent_browser_a11y`, `agent_browser_vitals`, `agent_browser_record_start`, `agent_browser_record_stop`, `agent_browser_diff_screenshot`, `agent_browser_set_viewport`, `agent_browser_set_media`, `agent_browser_react_tree`).
- Quy định bắt buộc Session Isolation (`AGENT_BROWSER_SESSION` và `--pin-tab`) cho Supergraph Team.
- Hướng dẫn WebMCP discovery & invocation pattern.
- Hướng dẫn tối ưu token (`--delta`, `-c`, `-s`, `--if-changed`).
- Quy chuẩn Wait (loại bỏ khuyến nghị bare `wait <ms>` và `networkidle` trap).
- Bổ sung quy trình kiểm thử A11y (axe-core WCAG 2.1 AA) và Web Vitals.

TDD:
- Behavior: `test-browser-agent-skill.mjs` kiểm tra nội dung `SKILL.md` chứa đầy đủ các contract mới (session isolation, typed MCP tools, webmcp, a11y, vitals).
- Test file: plugins/supergraph/tests/test-browser-agent-skill.mjs
- Test name: browser-agent SKILL.md contract & MCP tool mapping
- 🔴 RED command: node --test plugins/supergraph/tests/test-browser-agent-skill.mjs
- Expected 🔴 RED failure: Missing test file or missing contract assertions in SKILL.md
- Minimal 🟢 GREEN change: Tạo test trước và cập nhật `SKILL.md` đáp ứng toàn bộ assertions.
- Refactor candidates: Giữ định dạng markdown mạch lạc, súc tích, theo phong cách Supergraph.
- Mocking: none

Steps:
1. 🔴 RED: Viết `plugins/supergraph/tests/test-browser-agent-skill.mjs` kiểm tra các hợp đồng văn bản của SKILL.md và templates.
   Command: node --test plugins/supergraph/tests/test-browser-agent-skill.mjs
   Expected: FAIL (file chưa tồn tại hoặc test fail)
2. 🟢 GREEN: Viết nội dung mới chuẩn hóa cho `plugins/supergraph/skills/browser-agent/SKILL.md`.
   Command: node --test plugins/supergraph/tests/test-browser-agent-skill.mjs
   Expected: PASS phần test cho SKILL.md
3. REFACTOR: Rà soát từ ngữ kỹ thuật, đảm bảo không có filler words.
4. VERIFY:
   - npm test

Checkpoint:
- Files: plugins/supergraph/skills/browser-agent/SKILL.md plugins/supergraph/tests/test-browser-agent-skill.mjs
- Commit: docs(browser-agent): overhaul skill spec with session isolation, webmcp, and full mcp tools

---

## Task 2: Upgrade QA Templates with Accessibility, Web Vitals & Video Repro
Wave: 2
Status: pending
Risk: low
Dependencies: Task 1
Model: flash

Files:
- Modify: plugins/supergraph/skills/browser-agent/templates/test-matrix-template.md
- Modify: plugins/supergraph/skills/browser-agent/templates/test-matrix-fullstack-template.md
- Modify: plugins/supergraph/skills/browser-agent/templates/bug-report-template.md
- Test: plugins/supergraph/tests/test-browser-agent-skill.mjs

Blast radius:
- plugins/supergraph/skills/browser-agent/templates/*

Acceptance:
- `test-matrix-template.md` có thêm test case Accessibility WCAG 2.1 AA (`TC-{{PREFIX}}-008`), Responsive Mobile Viewport (`TC-{{PREFIX}}-009`), và mục kiểm tra Web Vitals (CLS/LCP) trong Checklist.
- `test-matrix-fullstack-template.md` được bổ sung phần Accessibility & Web Vitals tương ứng.
- `bug-report-template.md` hỗ trợ đính kèm video tái hiện lỗi (`.webm` với `--cursor --contact-sheet`) cho các lỗi tương tác (Interactive Bugs), tách bạch với ảnh tĩnh cho lỗi hiển thị (Static Bugs).

TDD:
- Behavior: `test-browser-agent-skill.mjs` kiểm tra các template chứa placeholder và cấu trúc video repro, a11y, vitals.
- Test file: plugins/supergraph/tests/test-browser-agent-skill.mjs
- Test name: QA templates contain a11y, vitals and video repro sections
- 🔴 RED command: node --test plugins/supergraph/tests/test-browser-agent-skill.mjs
- Expected 🔴 RED failure: Assertion fails for missing sections in templates
- Minimal 🟢 GREEN change: Bổ sung các section vào 3 file template.
- Refactor candidates: none
- Mocking: none

Steps:
1. 🔴 RED: Mở rộng test assertion trong `test-browser-agent-skill.mjs` cho các template.
   Command: node --test plugins/supergraph/tests/test-browser-agent-skill.mjs
   Expected: FAIL (template thiếu các mục mới)
2. 🟢 GREEN: Cập nhật `test-matrix-template.md`, `test-matrix-fullstack-template.md`, `bug-report-template.md`.
   Command: node --test plugins/supergraph/tests/test-browser-agent-skill.mjs
   Expected: PASS
3. REFACTOR: Đảm bảo bảng ma trận căn lề chuẩn markdown.
4. VERIFY:
   - npm test

Checkpoint:
- Files: plugins/supergraph/skills/browser-agent/templates/*
- Commit: feat(browser-agent): add a11y, vitals, and video repro to qa templates

---

## Task 3: Enhance init-qa.sh with Dev Server Auto-Detection
Wave: 3
Status: pending
Risk: low
Dependencies: Task 2
Model: inherit

Files:
- Modify: plugins/supergraph/skills/browser-agent/scripts/init-qa.sh
- Test: plugins/supergraph/tests/test-browser-agent-skill.mjs

Blast radius:
- plugins/supergraph/skills/browser-agent/scripts/init-qa.sh

Acceptance:
- `init-qa.sh` tự động quét các port phổ biến (`3000`, `5173`, `8080`, `4321`, `8000`) khi target-url không được truyền vào hoặc đang ở default.
- Điền đúng port đang active vào ma trận thay vì cố định gán `3000`.
- Cập nhật số lượng testcase mặc định (`TOTAL_TC`) phản ánh đúng số lượng test case mới (bao gồm A11y & Responsive).
- Hỗ trợ scaffold trường video repro trong lệnh `init-qa.sh bug`.
- Chạy qua kiểm tra cú pháp bash: `bash -n plugins/supergraph/skills/browser-agent/scripts/init-qa.sh`.

TDD:
- Behavior: Chạy thử `init-qa.sh matrix sample ui` sinh ra file ma trận có đủ TC a11y/vitals, và `init-qa.sh bug` sinh ra bug report có trường video.
- Test file: plugins/supergraph/tests/test-browser-agent-skill.mjs
- Test name: init-qa.sh generation and port probe integration
- 🔴 RED command: node --test plugins/supergraph/tests/test-browser-agent-skill.mjs
- Expected 🔴 RED failure: TOTAL_TC mismatch or video section missing
- Minimal 🟢 GREEN change: Nâng cấp script `init-qa.sh`.
- Refactor candidates: Dùng subshell an toàn, xử lý biến quote đầy đủ.
- Mocking: none

Steps:
1. 🔴 RED: Thêm test case chạy `init-qa.sh` vào `test-browser-agent-skill.mjs`.
   Command: node --test plugins/supergraph/tests/test-browser-agent-skill.mjs
   Expected: FAIL
2. 🟢 GREEN: Viết logic auto-probe port và cập nhật template substitution trong `init-qa.sh`.
   Command: node --test plugins/supergraph/tests/test-browser-agent-skill.mjs
   Expected: PASS
3. REFACTOR: Dọn dẹp file tạm tạo ra trong test.
4. VERIFY:
   - bash -n plugins/supergraph/skills/browser-agent/scripts/init-qa.sh
   - npm test

Checkpoint:
- Files: plugins/supergraph/skills/browser-agent/scripts/init-qa.sh
- Commit: feat(browser-agent): add port auto-detection and video repro scaffold to init-qa.sh

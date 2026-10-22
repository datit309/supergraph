# Plan: Mặt Bằng Văn Phòng Ảo 2D Thực Tế (Top-Down Interactive 2D Office Floorplan)

## Architecture & Contracts

### 1. Mục Tiêu
Nâng cấp giao diện "Văn Phòng Team" trên Supergraph Team Live Monitor (`ui-html.js` / port 3333 & DSH Right Sidebar) thành một **Mặt Bằng Văn Phòng 2D Kiến Trúc Thực Tế (Architectural Top-Down 2D Floorplan)**:
- Có bố cục phân khu văn phòng hoàn chỉnh:
  - **Lối đi chính & Hành lang (Central Hallways & Corridors):** Lối đi rộng kết nối các phòng với dải thảm dẫn đường, có nhân sự di chuyển qua lại (walking animation).
  - **Khu Bàn Làm Việc (Engineering Bays / Workstations):** Các cụm bàn chữ L hoặc dãy bàn đối diện có vách ngăn, ghế xoay công thái học, màn hình kép chiếu sáng từ trên xuống, bàn phím, chuột.
  - **Nhân sự rõ ràng (Detailed 2D Avatars):** Top-down avatars (đầu tai nghe, bờ vai, đôi bàn tay gõ phím), tên `@architect`, `@frontend-dev`, `@backend-dev`, `@tester-qa`, `@git-ops`, `@agent-*`.
  - **Phòng Họp & Bảng Chiến Lược (War Room / Conference Room):** Bàn họp oval lớn, màn hình trình chiếu LED hiển thị Sứ mệnh & DAG Wave.
  - **Khu Vực Giải Lao & Cafe (Pantry & Coffee Corner):** Quầy pha cafe, máy pha espresso bốc khói, bình nước, cây xanh văn phòng.
  - **Phòng Kiểm Thử & Server (Native QA & Server Lab):** Tủ rack server led xanh đỏ, trạm QA agent.
- **Chuyển động & Trạng thái sống động:**
  - Nhân sự đang làm việc (`claimed`) gõ phím, màn hình phát ánh sáng cyan.
  - Nhân sự test `RED` có đèn cảnh báo đỏ.
  - Nhân sự test `GREEN` có huy hiệu xanh lá.
  - Nhân sự nghỉ (`idle`) hoặc hoàn thành (`merged`) đứng ở khu cafe hoặc đi dạo dọc hành lang.
- **Tương tác:** Click vào bất kỳ bàn nào trong bản đồ 2D sẽ highlight và mở Interactive Task Modal với TDD RED/GREEN log & diff.
- Hỗ trợ nút chuyển đổi linh hoạt: `🗺️ Mặt Bằng 2D` và `💻 Cụm Bàn Chi Tiết`.

---

## Tasks

## Task 1: Thiết kế & Cập nhật Test Contracts cho Mặt Bằng 2D
Wave: 1
Status: pending
Risk: low
Dependencies: none
Model: inherit

Files:
- Modify: plugins/supergraph/tests/test-ui-office-workspace.mjs

Acceptance:
- Test contract kiểm tra sự tồn tại của cấu trúc 2D floorplan (`.floorplan-container`, `.floorplan-hallway`, `.floorplan-workstation`, `.floorplan-person`, `.floorplan-meeting-room`, `.floorplan-pantry`).
- Kiểm tra animation styles cho nhân sự đi lại (`@keyframes walk-corridor`, `.walking-agent`).
- Kiểm tra tương tác click mở task modal trên các bàn 2D.

TDD:
- Behavior: Kiểm tra đầy đủ contract giao diện 2D Floorplan
- Test file: plugins/supergraph/tests/test-ui-office-workspace.mjs
- 🔴 RED command: node plugins/supergraph/tests/test-ui-office-workspace.mjs
- Expected 🔴 RED failure: assert.match fails for floorplan components
- Minimal 🟢 GREEN change: bổ sung markup và styles trong ui-html.js

Steps:
1. 🔴 RED: Thêm assertions kiểm tra 2D floorplan vào test-ui-office-workspace.mjs
   Command: node plugins/supergraph/tests/test-ui-office-workspace.mjs
   Expected: FAIL
2. 🟢 GREEN: Bổ sung components trong ui-html.js
   Command: node plugins/supergraph/tests/test-ui-office-workspace.mjs
   Expected: PASS
3. VERIFY: Toàn bộ 25+ tests pass

Checkpoint:
- Files: plugins/supergraph/tests/test-ui-office-workspace.mjs
- Commit: test(team-ui): define 2D office floorplan contract tests

---

## Task 2: Triển khai Mặt Bằng Văn Phòng 2D Thực Tế trong ui-html.js
Wave: 2
Status: pending
Risk: medium
Dependencies: Task 1
Model: pro

Files:
- Modify: plugins/supergraph/team/ui-html.js

Acceptance:
- Bổ sung CSS layout mặt bằng 2D nhìn từ trên xuống (top-down blueprint): sàn gỗ/gạch văn phòng, tường ngăn, cửa kính, hành lang trung tâm.
- Bố trí các khu vực: Engineering Bays (6 bàn làm việc với ghế, màn hình, bàn phím), Conference Room (bàn oval, smart display), Coffee Lounge (máy pha cafe, quầy bar), QA Station.
- Tạo hình nhân sự top-down 2D sinh động với đầu, tai nghe, áo màu đại diện theo role, cánh tay gõ bàn phím và bảng tên nổi.
- Triển khai nhân viên di chuyển dọc theo lối đi hành lang (CSS keyframe walking animation).
- Bổ sung toggle view giữa Mặt bằng 2D kiến trúc và Cụm bàn chi tiết.
- Kết nối click trên bàn làm việc 2D để mở Task Workbench Modal.

Steps:
1. 🔴 RED: Xác nhận test yêu cầu components 2D
2. 🟢 GREEN: Cập nhật CSS và HTML rendering của renderOffice() trong ui-html.js
   Command: node plugins/supergraph/tests/test-ui-office-workspace.mjs
   Expected: PASS
3. REFACTOR: Tối ưu hiệu năng rendering và tương thích Dark/Light mode
4. VERIFY: node --test plugins/supergraph/tests/*.mjs

Checkpoint:
- Files: plugins/supergraph/team/ui-html.js
- Commit: feat(team-ui): implement realistic 2D top-down office floorplan with animated corridors and desks

---

## Task 3: E2E Verification & Browser Testing via Agent-Browser
Wave: 3
Status: pending
Risk: low
Dependencies: Task 2
Model: inherit

Files:
- Test: tests E2E via agent-browser

Acceptance:
- Restart daemon sg-team-ui trên port 3333
- Dùng agent-browser mở http://127.0.0.1:3333, kiểm tra hiển thị mặt bằng 2D
- Kiểm tra click vào bàn làm việc trong mặt bằng 2D, xác nhận modal task hiển thị đúng
- Kiểm tra toggle chế độ xem và chuyển đổi theme Sáng/Tối
- Commit, push git và đồng bộ DSH plugin

Steps:
1. Restart daemon sg-team-ui
2. agent_browser_open http://127.0.0.1:3333
3. Chụp screenshot và kiểm tra snapshot
4. Push git master và cập nhật dsh web profile

Checkpoint:
- Commit: docs: record E2E verification of 2D office floorplan

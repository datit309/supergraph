# Plan: Sửa Lỗi UI Bị Dính Trong Khung & Tối Ưu Giao Diện Văn Phòng Ảo Co Giãn Linh Hoạt (Fluid Responsive Virtual Office)

## Root Cause Analysis
1. `.gather-map` có `height: 600px; min-width: 900px;` và `.gather-office` có `overflow: hidden;`.
2. `.gather-room-eng` bị gán `position: absolute; bottom: 14px; height: 228px;` và `overflow: hidden;`.
3. 6 bàn làm việc của nhân sự (3 hàng × 264px = 872px) vượt quá chiều cao 228px của phòng kỹ thuật, khiến 74% nội dung bị cắt bỏ hoặc dính chặt vào đáy khung.
4. Khi chạy bên trong DSH Right Sidebar (chiều rộng 380px - 500px), chiều rộng 900px bị tràn và `overflow: hidden` cắt mất 50% văn phòng bên phải (QA Lab, Pantry).
5. Hiện tượng tương tự cũng xảy ra ở 2D Floorplan (`.floorplan-engineering-bay` fixed 275px) và 3D Isometric (`.iso-room-eng` fixed 270px).

## Architecture & Contracts
- **Fluid Layout**:
  - Loại bỏ các giới hạn chiều cao cứng (`height: 228px; overflow: hidden;`) trên các phòng chứa bàn làm việc.
  - Cho phép `.gather-room-eng`, `.gather-map` và `.gather-office` tự động co giãn (`height: auto; min-height: ...`) theo số lượng nhân sự và task thực tế.
  - Hỗ trợ cuộn mượt mà (`overflow: auto;` hoặc layout dạng luồng tự nhiên) khi nằm trong khung nhỏ (iframe / DSH sidebar).
- **Responsive Breakpoints & Sidebar Adaptation**:
  - `@media (max-width: 960px)`:
    - Chuyển layout các phòng từ tọa độ cứng 4 góc sang bố cục tầng (Vertical Flow / Stacked Pods):
      1. Phòng Chỉ Huy Chiến Lược (War Room)
      2. Phòng Kiểm Thử & QA Lab
      3. Cụm Bàn Kỹ Thuật (Engineering Desks) - trải rộng 100%, 1-2 cột bàn làm việc
      4. Căng-tin & Cafe (Pantry)
    - Padding body thu gọn từ 24px xuống 12px để tận dụng tối đa chiều rộng sidebar.
    - Header và bộ lọc co giãn gọn gàng, không bị vỡ dòng hay dính mép.

## Execution Wave DAG
- **Wave 1**: `task-1-responsive-test` - Thêm test contract kiểm tra tính co giãn linh hoạt và không bị cắt cụt trong `test-ui-office-workspace.mjs`.
- **Wave 2**: `task-2-fluid-office-layout` - Tái cấu trúc CSS và layout trong `plugins/supergraph/team/ui-html.js` để hỗ trợ fluid auto-height và responsive sidebar mode.
- **Wave 3**: `task-3-verify-e2e` - Dùng `agent-browser` kiểm thử cả 2 chế độ: 480px (DSH sidebar) và 1280px (full desktop).

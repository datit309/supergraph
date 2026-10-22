# Kế Hoạch: Hiển Thị Nhân Sự & Trạng Thái Nghỉ Ngơi / Di Chuyển Khi Không Có Task (Idle Personnel Roaming & Lounge)

## Bối Cảnh
Người dùng phản ánh: "người đâu? nhân viên không có task thì cho di chuyển hoặc ngồi chơi".
- **Vấn đề 1**: Nhân vật lập trình viên trong SVG bàn làm việc bị ẩn do lớp CSS `.gather-character { display: none; }` vô tình áp dụng lên thẻ `<g class="gather-character">` chứa SVG nhân sự.
- **Vấn đề 2**: Các nhân sự trong chế độ chờ (không có task / Standby Pool) vẫn ngồi đơ ở bàn mà không có trạng thái nghỉ ngơi, thư giãn hoặc di chuyển quanh văn phòng (đi dạo hành lang, ngồi quầy bar Pantry uống cà phê, trao đổi ở War Room).

## Mục Tiêu & Tiêu Chí Nghiệm Thu
1. **Hiển thị rõ ràng nhân sự tại bàn làm việc**:
   - Loại bỏ triệt để xung đột CSS ẩn nhân vật. Nhân vật SVG được hiển thị sắc nét, ngồi ngay ngắn trên ghế công thái học trước màn hình.
2. **Trạng thái "Ngồi chơi / Thư giãn" tại bàn khi Idle (không có task)**:
   - Khi không có task: Nhân vật chuyển sang tư thế chill: đeo tai nghe over-ear phát nhạc (hiệu ứng đèn tai nghe chớp nhẹ), tay cầm điện thoại hoặc cốc cà phê, đầu lắc lư nhẹ theo điệu nhạc lofi.
   - Màn hình terminal bên phải chuyển sang màn hình chờ retro (Matrix digital rain hoặc "STANDBY - READY").
   - Bong bóng suy nghĩ hiển thị nội dung tự nhiên: "🎧 Lofi chill", "☕ Cà phê sáng", "📱 Đọc tin tức", "🎯 Chờ task mới...".
3. **Khu vực Pantry & Cafe (Căng-tin) đón nhân viên nghỉ ngơi**:
   - Nhân viên đang rảnh rỗi xuất hiện trực tiếp tại quầy bar đá Calacatta của Pantry: ngồi trên ghế bar cao, cầm ly cà phê hoặc nước ngọt, trò chuyện với nhau.
4. **Hành lang tuần tra & di chuyển (Office Corridors Roaming)**:
   - Các nhân viên đang ở chế độ chờ sẽ luân phiên di chuyển dọc theo hành lang giữa các phòng ban (từ Bàn làm việc -> Pantry -> Phòng họp) với animation bước chân sống động.

## Phân Chia Wave DAG & TDD
- **Wave 1**: `task-1-idle-personnel-contract-test`
  - Thêm contract tests trong `test-ui-office-workspace.mjs` kiểm tra hiển thị nhân vật (không bị ẩn display:none), tư thế thư giãn khi idle, và nhân sự di chuyển/nghỉ ngơi ở Pantry & Hành lang.
- **Wave 2**: `task-2-fix-seated-avatar-visibility-and-chill-posture`
  - Sửa CSS `.gather-character`, đảm bảo SVG nhân sự tại bàn luôn hiển thị 100%.
  - Bổ sung tư thế thư giãn cho `renderHumanDeveloperSvg` khi `!isWorking` (tai nghe over-ear, cốc cà phê/điện thoại, animation thư thái).
- **Wave 3**: `task-3-pantry-lounge-and-corridor-roaming-ui`
  - Nâng cấp khu vực Pantry: hiển thị các avatar nhân sự đang rảnh ngồi ở quầy bar.
  - Bổ sung nhân sự di chuyển dạo bước trên hành lang văn phòng (`.gather-roaming-agents`).
- **Wave 4**: `task-4-e2e-browser-verification`
  - Kiểm thử E2E trên `agent-browser` (port 3333): kiểm tra nhân vật hiển thị tại bàn, nhân sự rảnh rỗi di chuyển trên hành lang và ngồi ở Pantry, chụp ảnh bằng chứng nghiệm thu.

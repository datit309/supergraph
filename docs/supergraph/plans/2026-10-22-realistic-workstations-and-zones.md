# Kế Hoạch: Thiết Kế Lại Bàn Làm Việc & Khu Vực Văn Phòng Chuẩn Tech Studio Hiện Đại

## Bối Cảnh
Người dùng phản hồi: "bàn làm việc, khu vực làm việc cũng chưa giống".
Hiện tại các bàn làm việc ở các chế độ hiển thị còn mang tính biểu tượng hình học tối giản, các khu vực (War Room, QA Lab, Pantry) còn đơn giản, chưa toát lên không gian làm việc của một Tech Studio / Silicon Valley Engineering Lab thực thụ.

## Mục Tiêu & Tiêu Chí
1. **Ultra-Realistic Developer Workstation (Bàn làm việc thực tế)**:
   - Mặt bàn gỗ sồi (Oak) vân gỗ tự nhiên với mép vát 3D (chamfered edge), phủ dầu bóng.
   - Chân bàn kim loại chữ T sơn tĩnh điện màu đen mờ, có giàn đi dây cáp giấu dưới gầm bàn.
   - Tay đỡ màn hình đôi (Dual-Monitor Heavy-Duty Arm) kẹp bàn bằng thép vững chắc.
   - Dual frameless IPS monitors: Màn hình trái mở VS Code IDE với thanh tab file, số dòng, syntax highlight và status bar xanh `master`. Màn hình phải mở Terminal zsh chạy test TDD (RED/GREEN).
   - Đèn BenQ ScreenBar LED gắn viền trên màn hình tỏa ánh sáng vàng ấm xuống mặt bàn.
   - Thảm lót bàn bằng nỉ cao cấp (Stitched Felt Desk Mat) bo góc.
   - Bàn phím cơ custom Tenkeyless (TKL) với dây cáp xoắn Aviator Cable nối vào máy tính.
   - Chuột không dây công thái học (Ergonomic Mouse - Logitech MX Master style).
   - Cốc gốm cà phê nóng đặt trên đế lót ly bằng bần (cork coaster), bốc làn khói nhẹ.
   - Cụm máy Mac Studio / Mini PC bằng nhôm nguyên khối.
   - Chậu cây sen đá mọng nước (succulent pot).
   - Ghế công thái học lưới thoáng khí (Herman Miller Aeron style) với chân sao 5 bánh xe.

2. **War Room (Phòng Chỉ Huy Chiến Lược)**:
   - Bàn họp hình oval lớn bằng gỗ óc chó cao cấp (Walnut) viền kính mờ frosted glass.
   - Micro hội nghị đa hướng 360° (Polycom/Jabra puck) đặt giữa bàn.
   - Laptops mở phục vụ hội thảo chiến lược.
   - 6 ghế xoay bọc da cao cấp quanh bàn.

3. **QA & Server Lab (Phòng Kiểm Thử & Server CDP)**:
   - Cụm tủ rack data center 42U mặt kính mờ màu khói với hệ thống đèn LED nhấp nháy (heartbeat blink).
   - Dây cáp mạng quang nối patch panel màu sắc trực quan.
   - Khay màn hình KVM hiển thị CDP 60 FPS trace metrics.
   - Kệ test thiết bị di động (Mobile Device Testing Bench).

4. **Pantry & Relaxation Bar (Căng-tin & Cà phê)**:
   - Quầy bar đảo ốp đá cẩm thạch trắng vân mây (Calacatta Marble) với mặt trước lam gỗ sồi.
   - Máy pha cà phê espresso 2 group chuyên nghiệp kiểu Ý với cần gạt đồng, đồng hồ đo áp suất và vòi hơi bốc khói.
   - Tủ lạnh thông minh 2 cánh inox cao cấp (Smart French Door Refrigerator).
   - Khay xếp ly tách sứ và đĩa trái cây tươi.

## Waves DAG & Phân Công Nhiệm Vụ
- **Wave 1**: `task-1-workstation-contract-test` (TDD RED Contract)
- **Wave 2**: `task-2-tech-workstation-svg` (Triển khai SVG bàn làm việc thực tế `renderTechWorkstationSvg`)
- **Wave 3**: `task-3-architectural-zones-ui` (Triển khai nội thất chi tiết War Room, QA Lab, Pantry)
- **Wave 4**: `task-4-e2e-browser-verification` (Kiểm thử E2E bằng agent-browser trên cổng 3333)

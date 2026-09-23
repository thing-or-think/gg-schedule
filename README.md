# 📅 Smart Schedule & Life Manager (2026-2027)

Ứng dụng Web tĩnh thuần **HTML5 + TypeScript** giúp quản lý thời khóa biểu đại học, lịch tự học, thói quen dậy sớm 05:00 chạy bộ, học Tiếng Anh, luyện code LeetCode và dự án cá nhân.

---

## 🚀 Tính Năng Nổi Bật (100% Client-Side - Không cần Backend Python)

1. **Gõ link là vào ngay**: Không cần cài đặt môi trường, không cần chạy file `.bat`, 0MB RAM khi tắt tab.
2. **4 Chế độ hiển thị trực quan**:
   - 📅 **Ngày**: Khung giờ 05:00 - 23:00, lộ trình thứ tự chi tiết từng hoạt động.
   - 📊 **Tuần**: Ma trận tuần 7 ngày, kéo xem các tuần trong học kỳ.
   - 🗓️ **Tháng**: Lịch tháng tổng quan với nút chuyển nhanh các tháng 9, 10, 11, 12/2026.
   - 📋 **Danh sách**: Dạng bảng chi tiết kèm bộ lọc phân loại thông minh.
3. **Đánh dấu hoàn thành & Chống tích ảo**: Điểm danh hoạt động trong khung giờ thực tế kèm tính điểm năng suất hàng ngày.
4. **Theo dõi Thời gian thực (Realtime Tracker)**: Vạch báo giờ đỏ di chuyển trực tiếp, banner nhắc việc đang diễn ra và việc tiếp theo.
5. **Đồng bộ Lịch đa nền tảng**:
   - 📥 **Xuất file `.ics`**: Chuẩn RFC 5545, tương thích Google Calendar, Apple Calendar, Outlook.
   - ☁️ **Đẩy lên Google Calendar**: Tích hợp Google Identity Services (GIS SDK) đồng bộ trực tiếp từ trình duyệt.
   - 🧹 **Dọn dẹp lịch Google**: Xóa tự động các sự kiện trùng lặp.
   - 💾 **Sao lưu & Khôi phục JSON**: Xuất / Nhập file `courses_backup.json` để chia sẻ giữa các thiết bị.
6. **Chế độ Giao diện**: Hỗ trợ Sáng (Light), Tối (Dark), và Tự động theo Hệ thống (System).

---

## 💻 Cách Khởi Chạy Local

### 1. Chạy môi trường phát triển (Dev Server):
```bash
npm install
npm run dev
```
Trình duyệt sẽ tự động mở `http://localhost:5173`.

### 2. Đóng gói bản web tĩnh (Production Build):
```bash
npm run build
```
Thư mục `dist/` chứa toàn bộ file web tĩnh độc lập. Bạn có thể mở trực tiếp `dist/index.html` hoặc đưa lên bất kỳ hosting nào!

---

## 🌐 Triển khai Miễn Phí lên GitHub Pages (Để có link web dùng trên điện thoại & máy tính)

1. Tạo một repository mới trên GitHub (ví dụ: `gg-calendar`).
2. Đẩy toàn bộ mã nguồn lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: migrate to pure HTML + TypeScript web app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/gg-calendar.git
   git push -u origin main
   ```
3. Vào repository trên GitHub -> **Settings** -> **Pages**:
   - Tại mục **Build and deployment** > **Source**: Chọn **GitHub Actions**.
   - GitHub sẽ tự động build Vite và tạo link web tĩnh miễn phí trọn đời: `https://<your-username>.github.io/gg-calendar`.

---

## 📁 Cấu trúc Dự Án

```text
gg-calendar/
├── index.html                  # Giao diện chính (Tailwind CSS, FontAwesome, GIS SDK)
├── package.json                # Cấu hình TypeScript, Vite
├── tsconfig.json               # Cấu hình TypeScript Compiler
├── vite.config.ts              # Cấu hình đóng gói Vite (base relative './')
├── public/
│   └── default_courses.json    # Dữ liệu 103 hoạt động & môn học mẫu ban đầu
├── src/
│   ├── main.ts                 # Điều phối luồng và khởi chạy ứng dụng
│   ├── models/
│   │   └── types.ts            # Kiểu dữ liệu Course, Category, View, Theme
│   ├── constants/
│   │   └── config.ts           # Cấu hình giờ, chủ đề ngày, màu sắc, danh mục
│   ├── utils/
│   │   └── time.ts             # Xử lý tính toán thời gian, tuần, thứ, ngày
│   ├── services/
│   │   ├── storage.ts          # LocalStorage CRUD & Import/Export JSON
│   │   ├── icsExporter.ts      # Tạo và tải file .ics RFC 5545 trực tiếp
│   │   ├── googleCalendar.ts   # Client-side Google Calendar REST API
│   │   ├── theme.ts            # Quản lý Dark/Light/System Theme
│   │   ├── tracker.ts          # Đồng hồ thực & Vạch thời gian hiện tại
│   │   └── completion.ts       # Đánh dấu hoàn thành môn & Điểm năng suất
│   ├── views/
│   │   ├── dayView.ts          # Render Ngày & Lộ trình chi tiết
│   │   ├── weekView.ts         # Render Tuần & Ma trận thời khóa biểu
│   │   ├── monthView.ts        # Render Tháng & Chọn nhanh kỳ học
│   │   ├── listView.ts         # Render Bảng danh sách hoạt động
│   │   └── modals.ts           # Quản lý Popup Thêm/Sửa môn, Sync, Dọn trùng
│   └── style.css               # Tùy chỉnh Scrollbar và Animation
```

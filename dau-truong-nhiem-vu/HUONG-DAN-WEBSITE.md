# Đấu Trường Nhiệm Vụ: chạy như website

Bản website nằm ở thư mục `nhiem-vu/` (tạo tự động từ `dau-truong-nhiem-vu/index.html` bằng `python3 dau-truong-nhiem-vu/build.py`).

## 1. Đưa lên mạng bằng GitHub Pages (miễn phí)
1. Gộp nhánh này vào nhánh `main`.
2. Vào repo trên GitHub → **Settings → Pages** → Source: *Deploy from a branch* → chọn `main` / `/ (root)` → **Save**.
3. Sau 1–2 phút, app chạy ở: `https://truongthanhtamdev.github.io/DEMOOOOO/nhiem-vu/`

Lúc này app ở **chế độ thử**: dữ liệu chỉ lưu trên trình duyệt của từng người.

## 2. Bật dữ liệu dùng chung cho cả đội (Firebase, miễn phí)
1. Vào https://console.firebase.google.com → **Add project** (tắt Google Analytics cho nhanh).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable**.
   Ở tab **Settings → Authorized domains**, thêm `truongthanhtamdev.github.io`.
3. **Build → Firestore Database → Create database** (chọn vùng `asia-southeast1`, chế độ *production*).
   Mở tab **Rules**, dán toàn bộ nội dung file `dau-truong-nhiem-vu/firestore.rules` → **Publish**.
4. **Project settings (bánh răng) → Your apps → Web (`</>`)** → đặt tên → copy đoạn `firebaseConfig`.
5. Mở file `nhiem-vu/config.js`, thay `null` bằng cấu hình vừa copy, ví dụ:
   ```js
   window.DTNV_FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "ten-du-an.firebaseapp.com",
     projectId: "ten-du-an",
     appId: "1:123:web:abc"
   };
   ```
   (Cấu hình web của Firebase không phải mật khẩu; bảo mật nằm ở file rules.)
6. Commit và push. **Người đăng nhập đầu tiên sẽ là quản lý.** Quản lý cấp quyền cho quản lý khác ở tab *Quản lý → Nhân viên & cài đặt → Cấp quyền QL*.

## Phân quyền (đã cài sẵn trong firestore.rules)
- Chỉ quản lý được cộng/trừ XP, xu, quản lý phần thưởng và cài đặt.
- Nhân viên chỉ được nộp nhiệm vụ, tạo hồ sơ của mình và gửi yêu cầu đổi quà cho chính mình.

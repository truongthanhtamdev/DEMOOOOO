# Thuê xe tự lái dài hạn — website + hệ thống quản lý (bản demo)

Bản demo chạy được ngay, **không cần cài gì**: mở `thuexe/index.html` bằng trình duyệt.

| File | Là gì |
|---|---|
| `index.html` | Website cho khách: giới thiệu, danh sách xe, bảng giá, máy tính chi phí, form gửi yêu cầu thuê |
| `admin.html` | Hệ thống quản lý nội bộ (link ở cuối trang khách) |
| `assets/js/store.js` | Toàn bộ dữ liệu + quy tắc nghiệp vụ. Chỗ duy nhất cần sửa khi nối database thật |
| `assets/js/site.js` / `admin.js` | Giao diện của 2 trang |

## Chạy thử

Mở thẳng `thuexe/index.html`, hoặc chạy server cho giống thật:

```bash
cd thuexe && python3 -m http.server 8080   # rồi mở http://localhost:8080
```

Vào trang quản lý chọn vai trò **Chủ xe** hoặc **Nhân viên** để thấy khác biệt quyền.

## Giao diện

- Trang khách: hero nền tối, thẻ kính tính chi phí, thẻ xe có hiệu ứng hover, bảng giá làm nổi cột 12 tháng, FAQ dạng gập, nút gọi/Zalo nổi.
- Trang quản lý: sidebar cố định (điện thoại thì trượt ra), thẻ số liệu có icon, **nút đổi nền sáng/tối** ở góc dưới sidebar.
- Ảnh xe tạm: SVG tự sinh, vẽ đúng dáng sedan 5 chỗ hoặc MPV 7 chỗ, mỗi biển số ra một màu riêng. Không cần mạng, không cần file ảnh.
- Toàn bộ màu sắc nằm trong biến CSS ở `assets/css/style.css` — đổi màu thương hiệu chỉ sửa một chỗ.

## Đã có gì

**Website khách**
- 20 xe mẫu, lọc theo số chỗ / hộp số / giá, tìm theo tên
- Bảng giá 1–3–6–12 tháng, càng dài càng rẻ (−5% / −10% / −15%)
- Máy tính chi phí: tiền tháng, tổng hợp đồng, cọc, số tiền cần chuẩn bị lúc nhận xe
- Form gửi yêu cầu → chạy thẳng vào tab "Yêu cầu từ web" bên quản lý
- Nút gọi / Zalo nổi, chạy tốt trên điện thoại

**Hệ thống quản lý**
- **Tổng quan**: công nợ quá hạn, tiền sắp tới hạn, doanh thu tháng, tỷ lệ khai thác, lịch xe 6 tháng dạng thanh
- **Thu tiền**: mỗi hợp đồng tự sinh đủ các kỳ theo tháng; lọc Cần thu ngay / Tới hạn 7 ngày / Kỳ sau / Đã thu; nút "Đã thu" và nút soạn sẵn tin nhắn nhắc nợ
- **Đội xe**: dạng thẻ hoặc bảng, thêm/sửa xe, ODO, hạn đăng kiểm – bảo hiểm, chu kỳ bảo dưỡng, trả góp ngân hàng
- **Hợp đồng**: tạo hợp đồng (tự tính giá theo thời hạn), xem chi tiết từng kỳ, kết thúc hợp đồng, **in hợp đồng** ra giấy
- **Nhắc hạn**: đăng kiểm / bảo hiểm / bảo dưỡng trong 60 ngày + hợp đồng sắp hết hạn
- **Yêu cầu từ web**: gọi, đánh dấu đã liên hệ, bấm "Tạo hợp đồng" là chuyển thẳng thành khách + hợp đồng
- **Chi phí** và **Lãi/lỗ từng xe** (chỉ chủ xe thấy): thu − chi − trả góp theo 3/6/12 tháng
- **Khách hàng**: lịch sử thuê, công nợ từng người
- Xuất CSV (mở bằng Excel) cho xe / hợp đồng / thu tiền / chi phí, và **nạp danh sách xe bằng cách dán từ Excel**

## Giới hạn của bản demo

- Dữ liệu lưu trong **localStorage của trình duyệt** — chỉ nằm trên máy đang mở, không chia sẻ giữa điện thoại và máy tính, xoá lịch sử trình duyệt là mất.
- Đăng nhập chỉ là chọn vai trò, **chưa có mật khẩu và chưa bảo mật thật**.
- Ảnh xe là ảnh minh hoạ tự sinh (SVG). Dán link ảnh thật vào ô "Link ảnh" của từng xe là website hiện ngay.
- Nhắc hạn chỉ hiện trong hệ thống, **chưa tự gửi Zalo/SMS**.

## Bước tiếp theo khi chốt làm thật

1. Thay thông tin thật trong `assets/js/store.js` → `shop` (tên, số điện thoại, Zalo, địa chỉ).
2. Nạp 20 xe thật: trang quản lý → Đội xe → **Nạp từ Excel** (dán trực tiếp từ Google Sheet).
3. Nối database online (Supabase) để nhiều người dùng chung một dữ liệu: chỉ thay phần `load/save` trong `store.js`, giao diện giữ nguyên.
4. Thêm đăng nhập thật + phân quyền theo tài khoản.
5. Tự động nhắc: Zalo ZNS hoặc email trước hạn đóng tiền và hạn đăng kiểm.

# Hướng dẫn cài đặt — HKT Shop API

Tài liệu này hướng dẫn cài đặt và chạy dự án trên môi trường **Laragon** (Windows).
Có thể áp dụng tương tự cho XAMPP.

## 1. Yêu cầu hệ thống

- **Laragon** (đã bao gồm Apache + MySQL/MariaDB) — hoặc XAMPP.
- **PHP** ≥ 7.4 (khuyến nghị 8.x). Cần bật extension `pdo_mysql`.
- **MySQL** 8.x (hoặc MariaDB tương đương).
- Trình quản lý DB: **HeidiSQL** (đi kèm Laragon) hoặc phpMyAdmin.
- (Tùy chọn) **Composer** — chỉ cần nếu muốn dùng thư viện `firebase/php-jwt`.
- (Tùy chọn) **Postman** — để thử các endpoint API.

## 2. Lấy mã nguồn

Clone từ repository về thư mục web root của Laragon:

```bash
cd C:/laragon/www
git clone https://github.com/LePhucnz/P-HKT-Shop.git api_HKT
```

Hoặc copy thủ công thư mục `api_HKT` vào `C:/laragon/www/`.

## 3. Tạo và import cơ sở dữ liệu

1. Mở **HeidiSQL** (Laragon > Menu > MySQL > HeidiSQL) hoặc phpMyAdmin.
2. Tạo database tên **`ban_hang`** với charset `utf8mb4` / collation `utf8mb4_unicode_ci`.
   (File `sql.sql` đã có sẵn lệnh `CREATE DATABASE IF NOT EXISTS ban_hang`, nên bạn
   chỉ cần import là nó tự tạo.)
3. Import file `sql.sql`:
   - HeidiSQL: chọn database `ban_hang` > menu **File > Run SQL file** > chọn `sql.sql`.
   - Hoặc dùng dòng lệnh:
     ```bash
     mysql -u root ban_hang < sql.sql
     ```
4. (Nếu cần) chạy thêm `migration_don_hang.sql` để cập nhật cấu trúc bảng Đơn hàng / Hóa đơn.

## 4. Cấu hình kết nối

Mở `config/database.php`, kiểm tra/sửa thông tin cho khớp máy bạn:

```php
$host    = 'localhost';
$dbname  = 'ban_hang';
$user    = 'root';
$pass    = '';          // mặc định Laragon để trống
$charset = 'utf8mb4';
```

Mặc định Laragon dùng user `root` không mật khẩu nên thường không cần đổi gì.

## 5. Đổi khóa bí mật JWT

Mở `config/constants.php`, đổi `JWT_SECRET` sang một chuỗi ngẫu nhiên của riêng bạn:

```php
define('JWT_SECRET', 'chuoi_bi_mat_ngau_nhien_cua_ban');
```

> Thời hạn token mặc định 8 giờ (`JWT_EXPIRE`). JWT đã được viết sẵn thuần PHP
> trong `core/Jwt.php`, **không bắt buộc** cài Composer.

## 6. (Tùy chọn) Cài Composer

Chỉ cần nếu muốn dùng thư viện `firebase/php-jwt` thay cho bản tự viết:

```bash
cd C:/laragon/www/api_HKT
composer install
```

## 7. Chạy ứng dụng

Khởi động Laragon (bấm **Start All**). Sau đó:

- **API base URL:** `http://localhost/api_HKT/api`
- **Frontend (SPA):** `http://localhost/api_HKT/frontend`

> URL rewrite đã được cấu hình sẵn trong `.htaccess` (root) và `public/.htaccess`.
> Đảm bảo Apache đã bật `mod_rewrite` (Laragon bật sẵn).

### Dùng Virtual Host (tùy chọn, sạch hơn)

Có thể tạo Virtual Host trỏ document root vào thư mục `public/` để URL gọn hơn
(`http://hkt.test/api`). Laragon hỗ trợ tạo nhanh qua menu **Apache > sites-enabled**.

## 8. Kiểm tra hoạt động

1. Mở trình duyệt vào frontend, đăng nhập bằng tài khoản mẫu:
   - Email: `admin@hkt.com` — Mật khẩu: `123456`
2. Hoặc test API bằng Postman:
   - Import `HKT_Shop.postman_collection.json`.
   - Gọi `POST /api/auth/login` với email + mật khẩu để lấy `token`.
   - Các request cần quyền: thêm header `Authorization: Bearer <token>`.

## 9. Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân & cách khắc phục |
|---|---|
| Lỗi "Lỗi kết nối database" | Sai thông tin trong `config/database.php`, hoặc chưa tạo DB `ban_hang`. |
| API trả 404 cho mọi route | `mod_rewrite` chưa bật, hoặc `.htaccess` không được Apache đọc (kiểm tra `AllowOverride All`). |
| Header Authorization bị mất | Đảm bảo dùng `public/.htaccess` (đã có rule chuyển Authorization vào PHP). |
| Lỗi 401 dù đã đăng nhập | Token hết hạn (8 giờ) hoặc sai `JWT_SECRET`. Đăng nhập lại lấy token mới. |
| Ảnh upload không hiện | Kiểm tra thư mục `public/uploads/products/` tồn tại và có quyền ghi. |

---

Sau khi hoàn tất các bước trên, hệ thống đã sẵn sàng để chạy và demo.

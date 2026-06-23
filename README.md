# HKT Shop — Hệ thống bán hàng & thanh toán cho cửa hàng bán lẻ

> Đồ án môn học — REST API thuần PHP + Frontend SPA. Mã dự án Jira: **PHKT**.

Hệ thống quản lý bán hàng cho cửa hàng bán lẻ: quản lý sản phẩm, kho, khách hàng,
bán hàng tại quầy (POS), thanh toán, hóa đơn, trả hàng và báo cáo doanh thu.
Backend là REST API viết bằng PHP thuần (không framework), xác thực bằng JWT;
frontend là Single Page Application dùng HTML/CSS/JavaScript + Bootstrap.

## Tính năng chính

- **Xác thực & phân quyền**: đăng nhập JWT, 4 vai trò (admin, manager, cashier, stock_keeper).
- **Quản lý danh mục & sản phẩm**: CRUD, upload ảnh, tìm kiếm, lọc.
- **Quản lý khách hàng**: CRUD, tích điểm, hạng thành viên.
- **Nhập kho & nhà cung cấp**: phiếu nhập, cập nhật tồn, cảnh báo tồn thấp.
- **Khuyến mãi**: giảm theo % hoặc số tiền, kiểm tra điều kiện áp dụng.
- **Bán hàng (POS)**: giỏ hàng, lập hóa đơn, trừ tồn, cộng điểm, in hóa đơn.
- **Thanh toán**: tiền mặt, QR, thẻ; tính tiền thừa/thiếu.
- **Trả hàng**: lập phiếu trả, hoàn tiền, cộng lại tồn kho.
- **Báo cáo**: doanh thu theo thời gian, top sản phẩm, tồn kho thấp.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Backend | PHP thuần (cấu trúc MVC → REST API) |
| Cơ sở dữ liệu | MySQL 8 (database `ban_hang`, utf8mb4) |
| Xác thực | JWT (HS256) — tự viết trong `core/Jwt.php`, không bắt buộc Composer |
| Frontend | HTML5, CSS, JavaScript (SPA), Bootstrap |
| Môi trường dev | Laragon (Apache + MySQL), HeidiSQL |

## Cấu trúc thư mục

```
api_HKT/
├── app/
│   ├── controllers/      # Các controller REST (Auth, Product, Order, Invoice, ...)
│   └── models/           # Tầng Model (BaseModel + các entity)
├── core/                 # Request, Response, Jwt, Auth (middleware)
├── config/               # database.php, constants.php
├── public/               # Front controller (index.php) + uploads + .htaccess
├── frontend/             # SPA: index.html, css/, js/
├── sql.sql               # Script tạo database ban_hang
├── migration_don_hang.sql
├── HKT_Shop.postman_collection.json   # Bộ test API cho Postman
├── README.md             # Tài liệu tổng quan (file này)
├── README_API.md         # Tài liệu chi tiết các endpoint API
└── INSTALL.md            # Hướng dẫn cài đặt từng bước
```

## Cài đặt nhanh

Xem hướng dẫn chi tiết trong [INSTALL.md](INSTALL.md). Tóm tắt:

1. Copy `api_HKT` vào thư mục `www` của Laragon.
2. Tạo database `ban_hang` và import `sql.sql`.
3. Kiểm tra kết nối trong `config/database.php`.
4. Truy cập API: `http://localhost/api_HKT/api`, frontend: `http://localhost/api_HKT/frontend`.

## Tài khoản mẫu

Mật khẩu tất cả: **123456**

| Email | Vai trò |
|---|---|
| admin@hkt.com | admin |
| manager@hkt.com | manager |
| thu_ngan@hkt.com | cashier |
| kho@hkt.com | stock_keeper |

## Tài liệu API

Chi tiết toàn bộ endpoint, định dạng request/response và mã trạng thái: xem
[README_API.md](README_API.md). Có thể import `HKT_Shop.postman_collection.json`
vào Postman để thử nhanh.

## Quy trình phát triển (Git / Agile)

Dự án tuân theo mô hình Git Flow + Scrum:

- Nhánh: `main` (ổn định) ← `develop` (tích hợp) ← `feature/*` (tính năng).
- Mỗi commit gắn mã Jira (`PHKT-xx`).
- Mỗi tính năng phát triển trên `feature/*`, mở Pull Request, review rồi merge vào `develop`.
- Cuối mỗi Sprint phát hành một Release: `v1.0.0`, `v2.0.0`, `v3.0.0`.

| Sprint | Release | Nội dung |
|---|---|---|
| Sprint 1 | v1.0.0 | Auth/JWT, phân quyền, sản phẩm & danh mục, frontend core |
| Sprint 2 | v2.0.0 | Khách hàng, nhập kho, nhà cung cấp, khuyến mãi |
| Sprint 3 | v3.0.0 | Bán hàng POS, hóa đơn, thanh toán, trả hàng, báo cáo |

> Đồ án phục vụ mục đích học tập tại HUTECH.

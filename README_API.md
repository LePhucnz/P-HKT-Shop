# HKT Shop API

Chuyen tu project MVC (`p_HKT`) sang **REST API** thuan PHP + MySQL.
Giu nguyen toan bo tang **Model** va logic nghiep vu; thay tang Controller/View/Session
bang phan hoi **JSON** va xac thuc bang **JWT**.

## 1. Cai dat

1. Copy thu muc `api_HKT` vao `htdocs` (XAMPP) hoac `www` (Laragon).
2. Import database: dung file `sql.sql` (database ten `ban_hang`).
3. Sua thong tin ket noi trong `config/database.php` neu can.
4. **Doi** `JWT_SECRET` trong `config/constants.php` truoc khi dung that.
5. Truy cap: `http://localhost/api_HKT/api` (hoac cau hinh Virtual Host tro vao `public/`).

> Khong can `composer install`. JWT da duoc viet san trong `core/Jwt.php` (HS256, thuan PHP).
> Neu muon dung `firebase/php-jwt` thi van chay `composer install` duoc (da co `composer.json`).

## 2. Xac thuc (JWT)

- Goi `POST /api/auth/login` de lay `token`.
- Cac request can quyen: them header `Authorization: Bearer <token>`.
- Token het han sau 8 gio (sua `JWT_EXPIRE`).

Tai khoan mau (mat khau tat ca: **123456**):

| Email             | Vai tro       |
|-------------------|---------------|
| admin@hkt.com     | admin         |
| manager@hkt.com   | manager       |
| thu_ngan@hkt.com  | cashier       |
| kho@hkt.com       | stock_keeper  |

## 3. Cau truc phan hoi

Thanh cong:
```json
{ "success": true, "message": "OK", "data": { ... } }
```
Loi:
```json
{ "success": false, "message": "Mo ta loi", "errors": [ ... ] }
```

Ma trang thai: `200` OK, `201` da tao, `401` chua dang nhap, `403` khong du quyen,
`404` khong tim thay, `409` xung dot, `422` du lieu khong hop le.

## 4. Danh sach Endpoint

### Auth
| Method | Endpoint            | Quyen     | Mo ta                     |
|--------|---------------------|-----------|---------------------------|
| POST   | /api/auth/login     | -         | Dang nhap, tra ve token   |
| POST   | /api/auth/register  | -         | Dang ky (mac dinh cashier)|
| GET    | /api/auth/me        | dang nhap | Thong tin user hien tai   |

### Dashboard
| GET | /api/dashboard | dang nhap | So lieu tong quan |

### San pham (products)
| Method | Endpoint            | Quyen          |
|--------|---------------------|----------------|
| GET    | /api/products?search= | dang nhap    |
| GET    | /api/products/{id}  | dang nhap      |
| POST   | /api/products       | admin/manager  |
| PUT    | /api/products/{id}  | admin/manager  |
| POST   | /api/products/{id}  | admin/manager (cho upload anh - multipart) |
| DELETE | /api/products/{id}  | admin/manager  |

Upload anh: gui `multipart/form-data`, field file ten `hinh_anh`.

### Danh muc (categories)
GET / POST / GET{id} / PUT{id} / DELETE{id}  — `/api/categories`

### Khach hang (customers)
GET (`?search=`, `?hang_thanh_vien=`) / POST / GET{id} / PUT{id} / DELETE{id} — `/api/customers`

### Hoa don (invoices)
| GET    | /api/invoices       | admin/manager/cashier |
| GET    | /api/invoices/{id}  | admin/manager/cashier |
| POST   | /api/invoices       | admin/manager/cashier |

Body tao hoa don:
```json
{
  "khach_hang_id": 1,
  "phuong_thuc_tt": "cash",
  "giam_gia": 0,
  "items": [
    { "san_pham_id": 1, "so_luong": 2 },
    { "san_pham_id": 3, "so_luong": 1 }
  ]
}
```

### Nhap kho (purchase-orders)
| GET | /api/purchase-orders | admin/manager/stock_keeper |
| GET | /api/purchase-orders/{id} | ... |
| POST | /api/purchase-orders | ... |
| DELETE | /api/purchase-orders/{id} | ... (hoan lai ton kho) |

Body tao phieu nhap:
```json
{
  "nha_cung_cap": "Cong ty ABC",
  "items": [ { "product_id": 1, "quantity": 50, "price": 10000 } ]
}
```

### Khuyen mai (promotions)
GET / GET active / POST / GET{id} / PUT{id} / PATCH{id}/toggle / DELETE{id} — `/api/promotions`
(quyen admin/manager; rieng `/active` chi can dang nhap)

### Nguoi dung (users) — chi admin
GET / POST / GET{id} / PUT{id} / DELETE{id} — `/api/users`

### Bao cao (reports) — admin/manager
| GET | /api/reports/revenue?start_date=&end_date= |
| GET | /api/reports/inventory?category_id= |

## 5. Khac biet so voi ban MVC

- Khong con View (.php HTML), khong con redirect, khong con `$_SESSION`.
- Gio hang (`cart`) khong luu trong session nua — client gui thang `items` khi tao hoa don (stateless).
- Phan quyen chuyen tu `User::requireLogin()`/`hasRole()` (session) sang `Auth::requireLogin()`/`requireRole()` (JWT).
- Xuat CSV (exportRevenue/exportInventory) duoc thay bang endpoint JSON `/api/reports/...`;
  client tu xuat file neu can.

### Tra hang (returns)
| Method | Endpoint                       | Quyen                  | Mo ta                              |
|--------|--------------------------------|------------------------|------------------------------------|
| GET    | /api/returns                   | admin/manager/cashier  | Lich su doi/tra                    |
| GET    | /api/returns/{id}              | admin/manager/cashier  | Chi tiet 1 phieu tra (kem details) |
| GET    | /api/returns/invoice/{invoiceId}| admin/manager/cashier | Lay hoa don + chi tiet de chon SP tra |
| POST   | /api/returns                   | admin/manager/cashier  | Tao phieu tra hang                 |

Luong demo tra hang:
1. `GET /api/returns/invoice/1` -> xem cac dong hoa don, lay `chi_tiet_hoa_don_id`.
2. `POST /api/returns` voi body:
```json
{
  "hoa_don_id": 1,
  "ly_do": "San pham bi loi",
  "phuong_thuc_hoan": "Tien mat",
  "items": [
    { "chi_tiet_hoa_don_id": 1, "so_luong_tra": 1 }
  ]
}
```

Khi tao phieu tra, API tu dong (trong 1 transaction):
- Tinh `so_tien_hoan` = don_gia * so_luong_tra cua tung dong.
- **Cong lai ton kho** cho san pham duoc tra.
- Chan tra qua so luong da mua (tinh ca cac lan tra truoc do).

---

## 6. Thuc the DON HANG (Sản phẩm → Đơn hàng → Hóa đơn)

De khop dung chuoi thuc the cua de bai, he thong tach **Don hang** (`don_hang`)
thanh thuc the rieng nam giua San pham va Hoa don.

Luong nghiep vu:
1. **Tao don hang** (`POST /api/orders`) — chon san pham vao don. Don o trang thai `pending`,
   **CHUA tru ton kho**, chua tich diem.
2. **Thanh toan** (`POST /api/orders/{id}/pay`) — sinh ra **Hoa don** (`hoa_don`),
   luc nay moi **tru ton kho** + **tich diem** + chuyen don sang `paid`.
3. Hoac **huy** (`POST /api/orders/{id}/cancel`) — chi huy duoc don con `pending`.

> Hoa don sinh ra co cot `don_hang_id` tro nguoc ve don hang goc.

### Endpoint don hang
| Method | Endpoint                    | Quyen                  | Mo ta                          |
|--------|-----------------------------|------------------------|--------------------------------|
| GET    | /api/orders                 | admin/manager/cashier  | Danh sach don hang             |
| GET    | /api/orders/{id}            | admin/manager/cashier  | Chi tiet don (kem hoa don neu da TT) |
| POST   | /api/orders                 | admin/manager/cashier  | Tao don hang (pending)         |
| POST   | /api/orders/{id}/pay        | admin/manager/cashier  | Thanh toan -> tao hoa don      |
| POST   | /api/orders/{id}/cancel     | admin/manager/cashier  | Huy don pending                |

Body tao don hang:
```json
{
  "khach_hang_id": 1,
  "giam_gia": 0,
  "items": [
    { "san_pham_id": 1, "so_luong": 2 }
  ]
}
```

Body thanh toan:
```json
{ "phuong_thuc_tt": "Tiền mặt" }
```

### Cai dat them
Sau khi import `sql.sql`, chay tiep file **`migration_don_hang.sql`** (trong phpMyAdmin → Import,
hoac copy noi dung vao tab SQL) de tao 2 bang `don_hang`, `chi_tiet_don_hang`
va them cot `don_hang_id` vao `hoa_don`.

> Luu y: endpoint `POST /api/invoices` cu (tao hoa don truc tiep) van con de tuong thich nguoc.
> Nhung theo dung de bai, nen dung luong moi: tao Don hang truoc, roi thanh toan.

---

## 7. Giao dien Web (frontend goi API)

Thu muc `frontend/` la giao dien web thuan HTML + JavaScript, goi vao API bang JWT
(dung lai giao dien Bootstrap cua ban MVC: sidebar toi, mau xanh, dashboard...).

### Cach chay
1. Dam bao API da chay (`http://localhost/api_HKT/api` tra ve JSON).
2. Mo trinh duyet: **`http://localhost/api_HKT/frontend/`**
3. Dang nhap bang tai khoan mau (admin@hkt.com / 123456).

> Neu ban dat project o thu muc/ten khac, sua dong `const API_BASE` o dau file
> `frontend/js/api.js` cho dung dia chi API.

### Cau truc frontend
- `index.html` — trang chu, nap cac script.
- `css/style.css` — giao dien (lay tu layout MVC cu).
- `js/api.js` — lop goi API + luu token (localStorage) + tien ich format.
- `js/ui.js` — modal dung chung.
- `js/app.js` — sidebar + router (dieu huong bang #hash).
- `js/pages-core.js` — Dang nhap, Dashboard.
- `js/pages-catalog.js` — San pham, Danh muc, Khach hang.
- `js/pages-sales.js` — Don hang (tao + thanh toan), Hoa don, Tra hang.
- `js/pages-admin.js` — Nhap kho, Khuyen mai, Bao cao, Nguoi dung.

### Cac trang da co
Dashboard · Don hang (tao gio hang -> thanh toan -> hoa don) · Hoa don (xem + in) ·
Tra hang · San pham · Danh muc · Nhap kho · Khach hang · Khuyen mai ·
Bao cao doanh thu · Bao cao ton kho · Nguoi dung.

Phan quyen tu dong an/hien menu theo vai tro (giong ban MVC):
thu ngan khong thay menu Nguoi dung, Bao cao...

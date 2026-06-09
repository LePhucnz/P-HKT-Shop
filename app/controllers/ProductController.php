<?php
require_once __DIR__ . '/../models/Product.php';
require_once __DIR__ . '/../models/Category.php';
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/Request.php';
require_once __DIR__ . '/../../core/Auth.php';

class ProductController {

    // Upload anh tu multipart/form-data (field: hinh_anh). Tra ve duong dan URL hoac $old.
    private function uploadImage($oldImage = null) {
        if (empty($_FILES['hinh_anh']['name'])) return $oldImage;

        $file    = $_FILES['hinh_anh'];
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $ext     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if (!in_array($ext, $allowed)) {
            Response::error('Chi chap nhan anh JPG, PNG, GIF, WEBP', 422);
        }
        if ($file['size'] > 2 * 1024 * 1024) {
            Response::error('Anh khong duoc vuot qua 2MB', 422);
        }

        if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
        $fileName = 'SP_' . time() . '_' . rand(100, 999) . '.' . $ext;

        if (move_uploaded_file($file['tmp_name'], UPLOAD_DIR . $fileName)) {
            // Xoa anh cu
            if ($oldImage) {
                $oldPath = UPLOAD_DIR . basename($oldImage);
                if (is_file($oldPath)) @unlink($oldPath);
            }
            return UPLOAD_URL . $fileName;
        }
        return $oldImage;
    }

    // GET /api/products?search=...
    public function index() {
        Auth::requireLogin();
        $model    = new Product();
        $keyword  = Request::query('search', '');
        $products = $keyword ? $model->search($keyword) : $model->getAllWithCategory();
        Response::success($products, 'Danh sach san pham');
    }

    // GET /api/products/{id}
    public function show($id) {
        Auth::requireLogin();
        $product = (new Product())->find($id);
        if (!$product) Response::error('Khong tim thay san pham', 404);
        Response::success($product, 'Chi tiet san pham');
    }

    // POST /api/products   (admin/manager)
    public function store() {
        Auth::requireRole([ROLE_ADMIN, ROLE_MANAGER]);
        $data = Request::body();

        if (empty($data['ten_sp'])) {
            Response::error('Ten san pham khong duoc trong', 422);
        }

        $hinh_anh = $this->uploadImage();

        $payload = [
            'ma_sp'        => 'SP' . time(),
            'ten_sp'       => trim($data['ten_sp']),
            'danh_muc_id'  => $data['danh_muc_id'] ?? null ?: null,
            'don_vi_tinh'  => trim($data['don_vi_tinh'] ?? 'cai'),
            'gia_ban'      => floatval($data['gia_ban'] ?? 0),
            'so_luong_ton' => intval($data['so_luong_ton'] ?? 0),
            'mo_ta'        => trim($data['mo_ta'] ?? ''),
            'hinh_anh'     => $hinh_anh,
        ];

        $model = new Product();
        if (!$model->create($payload)) Response::error('Them san pham that bai', 500);
        Response::success($payload, 'Them san pham thanh cong', 201);
    }

    // PUT/POST /api/products/{id}   (admin/manager)
    public function update($id) {
        Auth::requireRole([ROLE_ADMIN, ROLE_MANAGER]);
        $model   = new Product();
        $product = $model->find($id);
        if (!$product) Response::error('Khong tim thay san pham', 404);

        $data     = Request::body();
        $hinh_anh = $this->uploadImage($product['hinh_anh'] ?? null);

        $payload = [
            'ten_sp'      => trim($data['ten_sp'] ?? $product['ten_sp']),
            'danh_muc_id' => array_key_exists('danh_muc_id', $data) ? ($data['danh_muc_id'] ?: null) : $product['danh_muc_id'],
            'don_vi_tinh' => trim($data['don_vi_tinh'] ?? $product['don_vi_tinh']),
            'gia_ban'     => isset($data['gia_ban']) ? floatval($data['gia_ban']) : $product['gia_ban'],
            'mo_ta'       => trim($data['mo_ta'] ?? $product['mo_ta']),
            'hinh_anh'    => $hinh_anh,
        ];

        if (!$model->update($id, $payload)) Response::error('Cap nhat that bai', 500);
        Response::success(null, 'Cap nhat thanh cong');
    }

    // DELETE /api/products/{id}   (admin/manager)
    public function destroy($id) {
        Auth::requireRole([ROLE_ADMIN, ROLE_MANAGER]);
        $model   = new Product();
        $product = $model->find($id);
        if (!$product) Response::error('Khong tim thay san pham', 404);

        if ($model->isUsedInOrdersOrInvoices($id)) {
            Response::error('Khong the xoa: san pham nay da co trong don hang hoac hoa don', 409);
        }

        if (!$model->delete($id)) Response::error('Xoa that bai', 500);

        if (!empty($product['hinh_anh'])) {
            $p = UPLOAD_DIR . basename($product['hinh_anh']);
            if (is_file($p)) @unlink($p);
        }
        Response::success(null, 'Xoa san pham thanh cong');
    }
}

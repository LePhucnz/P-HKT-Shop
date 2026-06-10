<?php
require_once __DIR__ . '/../models/Category.php';
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/Request.php';
require_once __DIR__ . '/../../core/Auth.php';

class CategoryController {

    // GET /api/categories  (kem so luong san pham)
    public function index() {
        Auth::requireLogin();
        $db = Database::getConnection();
        $rows = $db->query(
            "SELECT d.*, COUNT(s.id) as product_count
             FROM danh_muc d
             LEFT JOIN san_pham s ON s.danh_muc_id = d.id
             GROUP BY d.id ORDER BY d.id ASC"
        )->fetchAll();
        Response::success($rows, 'Danh sach danh muc');
    }

    // GET /api/categories/{id}
    public function show($id) {
        Auth::requireLogin();
        $cat = (new Category())->find($id);
        if (!$cat) Response::error('Khong tim thay danh muc', 404);
        Response::success($cat, 'Chi tiet danh muc');
    }

    // POST /api/categories
    public function store() {
        Auth::requireLogin();
        $data = Request::validate(['ten_danh_muc']);
        $model = new Category();
        $payload = [
            'ten_danh_muc' => trim($data['ten_danh_muc']),
            'mo_ta'        => trim($data['mo_ta'] ?? ''),
        ];
        if (!$model->create($payload)) Response::error('Them danh muc that bai', 500);
        Response::success($payload, 'Them danh muc thanh cong', 201);
    }

    // PUT /api/categories/{id}
    public function update($id) {
        Auth::requireLogin();
        $model = new Category();
        if (!$model->find($id)) Response::error('Khong tim thay danh muc', 404);
        $data = Request::body();
        $payload = [
            'ten_danh_muc' => trim($data['ten_danh_muc'] ?? ''),
            'mo_ta'        => trim($data['mo_ta'] ?? ''),
        ];
        if (empty($payload['ten_danh_muc'])) Response::error('Ten danh muc khong duoc trong', 422);
        if (!$model->update($id, $payload)) Response::error('Cap nhat that bai', 500);
        Response::success(null, 'Cap nhat danh muc thanh cong');
    }

    // DELETE /api/categories/{id}
    public function destroy($id) {
        Auth::requireLogin();
        $model = new Category();
        if (!$model->find($id)) Response::error('Khong tim thay danh muc', 404);
        if ($model->hasProducts($id)) {
            Response::error('Khong the xoa danh muc dang co san pham', 409);
        }
        if (!$model->delete($id)) Response::error('Xoa that bai', 500);
        Response::success(null, 'Xoa danh muc thanh cong');
    }
}

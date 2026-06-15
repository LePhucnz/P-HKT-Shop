<?php
require_once __DIR__ . '/../models/Promotion.php';
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/Request.php';
require_once __DIR__ . '/../../core/Auth.php';

class PromotionController {

    private function guard() {
        return Auth::requireRole([ROLE_ADMIN, ROLE_MANAGER]);
    }

    // GET /api/promotions
    public function index() {
        $this->guard();
        Response::success((new Promotion())->all(), 'Danh sach khuyen mai');
    }

    // GET /api/promotions/active  (dang chay)
    public function active() {
        Auth::requireLogin();
        Response::success((new Promotion())->getActive(), 'Khuyen mai dang chay');
    }

    // GET /api/promotions/{id}
    public function show($id) {
        $this->guard();
        $promo = (new Promotion())->find($id);
        if (!$promo) Response::error('Khong tim thay khuyen mai', 404);
        Response::success($promo, 'Chi tiet khuyen mai');
    }

    // POST /api/promotions
    public function store() {
        $this->guard();
        $data = Request::validate(['ten_km', 'loai_km', 'gia_tri', 'ngay_bat_dau', 'ngay_ket_thuc']);
        $loai   = $data['loai_km'];
        $giatri = floatval($data['gia_tri']);
        if ($loai === 'percent' && $giatri > 100) {
            Response::error('Giam gia % khong duoc vuot qua 100', 422);
        }
        $payload = [
            'ten_km'        => trim($data['ten_km']),
            'mo_ta'         => trim($data['mo_ta'] ?? ''),
            'loai_km'       => $loai,
            'gia_tri'       => $giatri,
            'ngay_bat_dau'  => $data['ngay_bat_dau'],
            'ngay_ket_thuc' => $data['ngay_ket_thuc'],
            'trang_thai'    => 1,
        ];
        if (!(new Promotion())->create($payload)) Response::error('Them khuyen mai that bai', 500);
        Response::success(null, 'Them khuyen mai thanh cong', 201);
    }

    // PUT /api/promotions/{id}
    public function update($id) {
        $this->guard();
        $model = new Promotion();
        if (!$model->find($id)) Response::error('Khong tim thay khuyen mai', 404);
        $data   = Request::body();
        $loai   = $data['loai_km'] ?? '';
        $giatri = floatval($data['gia_tri'] ?? 0);
        if ($loai === 'percent' && $giatri > 100) {
            Response::error('Giam gia % khong duoc vuot qua 100', 422);
        }
        $payload = [
            'ten_km'        => trim($data['ten_km'] ?? ''),
            'mo_ta'         => trim($data['mo_ta'] ?? ''),
            'loai_km'       => $loai,
            'gia_tri'       => $giatri,
            'ngay_bat_dau'  => $data['ngay_bat_dau'] ?? null,
            'ngay_ket_thuc' => $data['ngay_ket_thuc'] ?? null,
        ];
        if (!$model->update($id, $payload)) Response::error('Cap nhat that bai', 500);
        Response::success(null, 'Cap nhat khuyen mai thanh cong');
    }

    // PATCH /api/promotions/{id}/toggle
    public function toggle($id) {
        $this->guard();
        $model = new Promotion();
        $promo = $model->find($id);
        if (!$promo) Response::error('Khong tim thay khuyen mai', 404);
        $newStatus = $promo['trang_thai'] ? 0 : 1;
        $model->updateStatus($id, $newStatus);
        Response::success(['trang_thai' => $newStatus], $newStatus ? 'Da kich hoat' : 'Da tat');
    }

    // DELETE /api/promotions/{id}
    public function destroy($id) {
        $this->guard();
        $model = new Promotion();
        if (!$model->find($id)) Response::error('Khong tim thay khuyen mai', 404);
        if (!$model->delete($id)) Response::error('Xoa that bai', 500);
        Response::success(null, 'Xoa khuyen mai thanh cong');
    }
}

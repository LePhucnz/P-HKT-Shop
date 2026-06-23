<?php
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/Request.php';
require_once __DIR__ . '/../../core/Auth.php';

class UserController {

    private function guard() {
        return Auth::requireRole([ROLE_ADMIN]);
    }

    // GET /api/users
    public function index() {
        $this->guard();
        Response::success((new User())->all(), 'Danh sach nguoi dung');
    }

    // GET /api/users/{id}
    public function show($id) {
        $this->guard();
        $user = (new User())->find($id);
        if (!$user) Response::error('Khong tim thay nguoi dung', 404);
        Response::success($user, 'Chi tiet nguoi dung');
    }

    // POST /api/users
    public function store() {
        $this->guard();
        $data = Request::validate(['ho_ten', 'email', 'mat_khau', 'vai_tro']);
        $model = new User();
        if ($model->findByEmail(trim($data['email']))) {
            Response::error('Email da ton tai', 409);
        }
        $ok = $model->create([
            'ho_ten'   => trim($data['ho_ten']),
            'email'    => trim($data['email']),
            'mat_khau' => password_hash($data['mat_khau'], PASSWORD_BCRYPT),
            'vai_tro'  => $data['vai_tro'],
        ]);
        if (!$ok) Response::error('Them nguoi dung that bai', 500);
        Response::success(null, 'Them nguoi dung thanh cong', 201);
    }

    // PUT /api/users/{id}
    public function update($id) {
        $this->guard();
        $model = new User();
        $user  = $model->find($id);
        if (!$user) Response::error('Khong tim thay nguoi dung', 404);
        if ($user['vai_tro'] === ROLE_ADMIN) {
            Response::error('Khong the chinh sua tai khoan Admin', 403);
        }
        $data = Request::body();
        $payload = [
            'ho_ten'   => trim($data['ho_ten'] ?? ''),
            'email'    => trim($data['email'] ?? ''),
            'vai_tro'  => $data['vai_tro'] ?? ROLE_CASHIER,
            'mat_khau' => !empty($data['mat_khau']) ? password_hash($data['mat_khau'], PASSWORD_BCRYPT) : '',
        ];
        if (!$model->update($id, $payload)) Response::error('Cap nhat that bai', 500);
        Response::success(null, 'Cap nhat nguoi dung thanh cong');
    }

    // DELETE /api/users/{id}
    public function destroy($id) {
        $caller = $this->guard();
        if ((int)$id === (int)$caller['sub']) {
            Response::error('Khong the xoa tai khoan dang dang nhap', 409);
        }
        $model  = new User();
        $target = $model->find($id);
        if (!$target) Response::error('Khong tim thay nguoi dung', 404);
        if ($target['vai_tro'] === ROLE_ADMIN) {
            Response::error('Khong the xoa tai khoan Admin', 403);
        }
        if (!$model->delete($id)) Response::error('Xoa that bai', 500);
        Response::success(null, 'Da xoa nguoi dung');
    }
}

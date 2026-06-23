<?php
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/Request.php';
require_once __DIR__ . '/../../core/Jwt.php';
require_once __DIR__ . '/../../core/Auth.php';

class AuthController {

    // POST /api/auth/login   { email, mat_khau }
    public function login() {
        $data  = Request::validate(['email', 'mat_khau']);
        $email = trim($data['email']);
        $pass  = $data['mat_khau'];

        $userModel = new User();
        $user      = $userModel->findByEmail($email);

        if (!$user || !password_verify($pass, $user['mat_khau'])) {
            Response::error('Email hoac mat khau khong dung', 401);
        }

        $token = Jwt::encode([
            'sub'     => (int)$user['id'],
            'ho_ten'  => $user['ho_ten'],
            'email'   => $user['email'],
            'vai_tro' => $user['vai_tro'],
        ]);

        Response::success([
            'token' => $token,
            'user'  => [
                'id'      => (int)$user['id'],
                'ho_ten'  => $user['ho_ten'],
                'email'   => $user['email'],
                'vai_tro' => $user['vai_tro'],
            ],
        ], 'Dang nhap thanh cong');
    }

    // POST /api/auth/register   { ho_ten, email, mat_khau }
    public function register() {
        $data     = Request::validate(['ho_ten', 'email', 'mat_khau']);
        $ho_ten   = trim($data['ho_ten']);
        $email    = trim($data['email']);
        $password = $data['mat_khau'];

        if (strlen($password) < 6) {
            Response::error('Mat khau phai it nhat 6 ky tu', 422);
        }

        $userModel = new User();
        if ($userModel->findByEmail($email)) {
            Response::error('Email da duoc su dung', 409);
        }

        $ok = $userModel->create([
            'ho_ten'   => $ho_ten,
            'email'    => $email,
            'mat_khau' => password_hash($password, PASSWORD_BCRYPT),
            'vai_tro'  => ROLE_CASHIER,
        ]);

        if (!$ok) Response::error('Dang ky that bai', 500);
        Response::success(null, 'Dang ky thanh cong', 201);
    }

    // GET /api/auth/me   (can token)
    public function me() {
        $payload   = Auth::requireLogin();
        $userModel = new User();
        $user      = $userModel->find($payload['sub']);
        if (!$user) Response::error('Khong tim thay nguoi dung', 404);
        Response::success($user, 'OK');
    }
}

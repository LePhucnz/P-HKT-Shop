<?php
// core/Auth.php - middleware xac thuc bang JWT (thay cho session)
require_once __DIR__ . '/Jwt.php';
require_once __DIR__ . '/Response.php';

class Auth {

    private static $user = null; // payload cua nguoi dung hien tai

    // Lay token tu header Authorization: Bearer xxx
    private static function getBearerToken() {
        $headers = null;

        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER['Authorization']);
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(
                array_map('ucwords', array_keys($requestHeaders)),
                array_values($requestHeaders)
            );
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }

        if ($headers && preg_match('/Bearer\s+(.*)$/i', $headers, $matches)) {
            return $matches[1];
        }
        return null;
    }

    // Bat buoc dang nhap. Tra ve payload, hoac dung 401.
    public static function requireLogin() {
        if (self::$user !== null) return self::$user;

        $token   = self::getBearerToken();
        $payload = Jwt::decode($token);

        if (!$payload) {
            Response::error('Token khong hop le hoac da het han', 401);
        }
        self::$user = $payload;
        return $payload;
    }

    // Bat buoc co 1 trong cac vai tro. Vi du: Auth::requireRole([ROLE_ADMIN, ROLE_MANAGER]);
    public static function requireRole($roles) {
        $user = self::requireLogin();
        if (is_string($roles)) $roles = [$roles];

        if (!in_array($user['vai_tro'] ?? '', $roles)) {
            Response::error('Ban khong co quyen thuc hien chuc nang nay', 403);
        }
        return $user;
    }

    // Lay user hien tai (sau khi requireLogin)
    public static function user() {
        return self::$user;
    }

    public static function id() {
        return self::$user['sub'] ?? null;
    }
}

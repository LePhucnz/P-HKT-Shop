<?php
// core/Request.php - doc body JSON / query / file mot cach thong nhat

class Request {

    private static $bodyCache = null;

    // Doc body: ho tro ca JSON va form-data/x-www-form-urlencoded
    public static function body() {
        if (self::$bodyCache !== null) return self::$bodyCache;

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (stripos($contentType, 'application/json') !== false) {
            $raw  = file_get_contents('php://input');
            $data = json_decode($raw, true);
            self::$bodyCache = is_array($data) ? $data : [];
        } else {
            // form-data hoac urlencoded (vi du khi upload anh)
            self::$bodyCache = $_POST;
        }
        return self::$bodyCache;
    }

    // Lay 1 truong tu body
    public static function input($key, $default = null) {
        $body = self::body();
        return $body[$key] ?? $default;
    }

    // Lay query string ?key=...
    public static function query($key, $default = null) {
        return $_GET[$key] ?? $default;
    }

    public static function method() {
        return $_SERVER['REQUEST_METHOD'] ?? 'GET';
    }

    // Kiem tra cac truong bat buoc; dung 422 neu thieu
    public static function validate(array $required) {
        $body    = self::body();
        $missing = [];
        foreach ($required as $field) {
            if (!isset($body[$field]) || $body[$field] === '') {
                $missing[] = $field;
            }
        }
        if ($missing) {
            require_once __DIR__ . '/Response.php';
            Response::error('Thieu truong bat buoc', 422, $missing);
        }
        return $body;
    }
}

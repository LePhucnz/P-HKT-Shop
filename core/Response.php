<?php
// core/Response.php - chuan hoa moi phan hoi JSON

class Response {

    public static function json($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success($data = null, $message = 'OK', $status = 200) {
        self::json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    public static function error($message = 'Error', $status = 400, $errors = null) {
        $body = [
            'success' => false,
            'message' => $message,
        ];
        if ($errors !== null) $body['errors'] = $errors;
        self::json($body, $status);
    }
}

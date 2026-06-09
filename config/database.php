<?php
class Database {
    private static $instance = null;

    public static function getConnection() {
        if (self::$instance === null) {
            $host    = 'localhost';
            $dbname  = 'ban_hang';
            $user    = 'root';
            $pass    = '';
            $charset = 'utf8mb4';
            try {
                self::$instance = new PDO(
                    "mysql:host=$host;dbname=$dbname;charset=$charset",
                    $user, $pass,
                    [
                        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES   => false,
                    ]
                );
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode([
                    'success' => false,
                    'message' => 'Lỗi kết nối database: ' . $e->getMessage()
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
        return self::$instance;
    }
}

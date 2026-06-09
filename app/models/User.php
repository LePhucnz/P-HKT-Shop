<?php
require_once __DIR__ . '/../../config/database.php';

class User {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function findByEmail($email) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email");
        $stmt->execute(['email' => $email]);
        return $stmt->fetch();
    }

    public function find($id) {
        $stmt = $this->db->prepare("SELECT id, ho_ten, email, vai_tro, ngay_tao FROM users WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    public function all() {
        return $this->db->query("SELECT id, ho_ten, email, vai_tro, ngay_tao FROM users ORDER BY id DESC")->fetchAll();
    }

    public function create($data) {
        $stmt = $this->db->prepare(
            "INSERT INTO users (ho_ten, email, mat_khau, vai_tro) VALUES (:ho_ten, :email, :mat_khau, :vai_tro)"
        );
        return $stmt->execute($data);
    }

    public function update($id, $data) {
        if (!empty($data['mat_khau'])) {
            $sql = "UPDATE users SET ho_ten=:ho_ten, email=:email, vai_tro=:vai_tro, mat_khau=:mat_khau WHERE id=:id";
        } else {
            unset($data['mat_khau']);
            $sql = "UPDATE users SET ho_ten=:ho_ten, email=:email, vai_tro=:vai_tro WHERE id=:id";
        }
        $data['id'] = $id;
        return $this->db->prepare($sql)->execute($data);
    }

    public function delete($id) {
        return $this->db->prepare("DELETE FROM users WHERE id=:id")->execute(['id' => $id]);
    }
}

<?php
// app/models/Category.php
require_once __DIR__ . '/BaseModel.php';

class Category extends BaseModel {
    protected $table = 'danh_muc';
    
    public function create($data) {
        $sql = "INSERT INTO danh_muc (ten_danh_muc, mo_ta) VALUES (:ten_danh_muc, :mo_ta)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($data);
    }
    
    public function update($id, $data) {
        $sql = "UPDATE danh_muc SET ten_danh_muc = :ten_danh_muc, mo_ta = :mo_ta WHERE id = :id";
        $data['id'] = $id;
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($data);
    }

    public function hasProducts($id) {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM san_pham WHERE danh_muc_id=:id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetchColumn() > 0;
    }
}
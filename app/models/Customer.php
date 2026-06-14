<?php
require_once __DIR__ . '/BaseModel.php';

class Customer extends BaseModel {
    protected $table = 'khach_hang';

    public function generateCustomerCode() {
        $stmt = $this->db->query("SELECT MAX(id) as max_id FROM khach_hang");
        $result = $stmt->fetch();
        $nextId = ($result['max_id'] ?? 0) + 1;
        return 'KH' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
    }

    public function create($data) {
        $data['ma_kh'] = $this->generateCustomerCode();
        $sql = "INSERT INTO khach_hang (ma_kh, ho_ten, so_dien_thoai, dia_chi, email, ngay_sinh, gioi_tinh)
                VALUES (:ma_kh, :ho_ten, :so_dien_thoai, :dia_chi, :email, :ngay_sinh, :gioi_tinh)";
        return $this->db->prepare($sql)->execute($data);
    }

    public function update($id, $data) {
        $sql = "UPDATE khach_hang SET ho_ten=:ho_ten, so_dien_thoai=:so_dien_thoai,
                email=:email, ngay_sinh=:ngay_sinh, dia_chi=:dia_chi, gioi_tinh=:gioi_tinh
                WHERE id=:id";
        $data['id'] = $id;
        return $this->db->prepare($sql)->execute($data);
    }

    public function addPoints($id, $points) {
        $this->db->prepare("UPDATE khach_hang SET diem_tich_luy=diem_tich_luy+:p WHERE id=:id")
                 ->execute(['p' => $points, 'id' => $id]);
        $this->updateMembership($id);
    }

    public function updateMembership($id) {
        $customer = $this->find($id);
        $points   = $customer['diem_tich_luy'];
        $rank = $points >= 10000 ? 'Kim cương' : ($points >= 5000 ? 'Vàng' : 'Bạc');
        $this->db->prepare("UPDATE khach_hang SET hang_thanh_vien=:r WHERE id=:id")
                 ->execute(['r' => $rank, 'id' => $id]);
    }

    public function search($keyword) {
        $stmt = $this->db->prepare(
            "SELECT * FROM khach_hang
             WHERE ho_ten LIKE :kw OR so_dien_thoai LIKE :kw OR ma_kh LIKE :kw
             ORDER BY id DESC"
        );
        $stmt->execute(['kw' => "%$keyword%"]);
        return $stmt->fetchAll();
    }

    public function filterByRank($rank) {
        $stmt = $this->db->prepare("SELECT * FROM khach_hang WHERE hang_thanh_vien=:r ORDER BY id DESC");
        $stmt->execute(['r' => $rank]);
        return $stmt->fetchAll();
    }

    public function hasInvoices($id) {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM hoa_don WHERE khach_hang_id=:id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetchColumn() > 0;
    }

    public function getInvoices($id) {
        $stmt = $this->db->prepare("SELECT * FROM hoa_don WHERE khach_hang_id=:id ORDER BY ngay_lap DESC");
        $stmt->execute(['id' => $id]);
        return $stmt->fetchAll();
    }

    public function getTotalSpent($id) {
        $stmt = $this->db->prepare("SELECT COALESCE(SUM(thanh_tien),0) FROM hoa_don WHERE khach_hang_id=:id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetchColumn();
    }

    public function getPointHistory($id) {
        $stmt = $this->db->prepare("SELECT * FROM hoa_don WHERE khach_hang_id=:id ORDER BY ngay_lap DESC LIMIT 10");
        $stmt->execute(['id' => $id]);
        return $stmt->fetchAll();
    }
}

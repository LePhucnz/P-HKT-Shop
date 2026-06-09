<?php
require_once __DIR__ . '/BaseModel.php';

class Product extends BaseModel {
    protected $table = 'san_pham';

    public function getAllWithCategory() {
        $stmt = $this->db->query(
            "SELECT sp.*, dm.ten_danh_muc
             FROM san_pham sp
             LEFT JOIN danh_muc dm ON sp.danh_muc_id=dm.id
             ORDER BY sp.id DESC"
        );
        return $stmt->fetchAll();
    }

    public function search($keyword) {
        $stmt = $this->db->prepare(
            "SELECT sp.*, dm.ten_danh_muc
             FROM san_pham sp
             LEFT JOIN danh_muc dm ON sp.danh_muc_id=dm.id
             WHERE sp.ten_sp LIKE :kw OR sp.ma_sp LIKE :kw
             ORDER BY sp.id DESC"
        );
        $stmt->execute(['kw' => "%$keyword%"]);
        return $stmt->fetchAll();
    }

    public function create($data) {
        $sql = "INSERT INTO san_pham (ma_sp, ten_sp, danh_muc_id, don_vi_tinh, gia_ban, so_luong_ton, mo_ta, hinh_anh)
                VALUES (:ma_sp, :ten_sp, :danh_muc_id, :don_vi_tinh, :gia_ban, :so_luong_ton, :mo_ta, :hinh_anh)";
        return $this->db->prepare($sql)->execute($data);
    }

    public function update($id, $data) {
        if (!empty($data['hinh_anh'])) {
            $sql = "UPDATE san_pham SET ten_sp=:ten_sp, danh_muc_id=:danh_muc_id,
                    don_vi_tinh=:don_vi_tinh, gia_ban=:gia_ban, mo_ta=:mo_ta, hinh_anh=:hinh_anh
                    WHERE id=:id";
        } else {
            unset($data['hinh_anh']);
            $sql = "UPDATE san_pham SET ten_sp=:ten_sp, danh_muc_id=:danh_muc_id,
                    don_vi_tinh=:don_vi_tinh, gia_ban=:gia_ban, mo_ta=:mo_ta
                    WHERE id=:id";
        }
        $data['id'] = $id;
        return $this->db->prepare($sql)->execute($data);
    }

    public function decreaseStock($productId, $quantity) {
        return $this->db->prepare(
            "UPDATE san_pham SET so_luong_ton=so_luong_ton-:q WHERE id=:id AND so_luong_ton>=:q2"
        )->execute(['id' => $productId, 'q' => $quantity, 'q2' => $quantity]);
    }

    public function increaseStock($productId, $quantity) {
        return $this->db->prepare(
            "UPDATE san_pham SET so_luong_ton=so_luong_ton+:q WHERE id=:id"
        )->execute(['id' => $productId, 'q' => $quantity]);
    }

    public function getInStock() {
        return $this->db->query(
            "SELECT * FROM san_pham WHERE so_luong_ton>0 ORDER BY ten_sp ASC"
        )->fetchAll();
    }

    public function isUsedInOrdersOrInvoices($id) {
        $stmt = $this->db->prepare(
            "SELECT
              (SELECT COUNT(*) FROM chi_tiet_don_hang WHERE san_pham_id = :id1) +
              (SELECT COUNT(*) FROM chi_tiet_hoa_don  WHERE san_pham_id = :id2) AS total"
        );
        $stmt->execute(['id1' => $id, 'id2' => $id]);
        return (int)$stmt->fetchColumn() > 0;
    }
}

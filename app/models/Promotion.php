<?php
require_once __DIR__ . '/BaseModel.php';

class Promotion extends BaseModel {
    protected $table = 'khuyen_mai';

    public function create($data) {
        $sql = "INSERT INTO khuyen_mai (ten_km, mo_ta, loai_km, gia_tri, ngay_bat_dau, ngay_ket_thuc, trang_thai)
                VALUES (:ten_km, :mo_ta, :loai_km, :gia_tri, :ngay_bat_dau, :ngay_ket_thuc, :trang_thai)";
        return $this->db->prepare($sql)->execute($data);
    }

    public function update($id, $data) {
        $sql = "UPDATE khuyen_mai SET ten_km=:ten_km, mo_ta=:mo_ta, loai_km=:loai_km,
                gia_tri=:gia_tri, ngay_bat_dau=:ngay_bat_dau, ngay_ket_thuc=:ngay_ket_thuc
                WHERE id=:id";
        $data['id'] = $id;
        return $this->db->prepare($sql)->execute($data);
    }

    public function updateStatus($id, $status) {
        return $this->db->prepare("UPDATE khuyen_mai SET trang_thai=:s WHERE id=:id")
                        ->execute(['s' => $status, 'id' => $id]);
    }

    public function getActive() {
        return $this->db->query(
            "SELECT * FROM khuyen_mai WHERE trang_thai=1 AND ngay_bat_dau<=NOW() AND ngay_ket_thuc>=NOW()"
        )->fetchAll();
    }

    public function apply($promo, $amount) {
        if ($promo['loai_km'] === 'percent')
            return $amount * (1 - $promo['gia_tri'] / 100);
        return max(0, $amount - $promo['gia_tri']);
    }
}

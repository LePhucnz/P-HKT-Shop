<?php
require_once __DIR__ . '/BaseModel.php';

class ReturnDetail extends BaseModel {
    protected $table = 'chi_tiet_tra_hang';

    public function create($data) {
        $sql = "INSERT INTO chi_tiet_tra_hang (tra_hang_id, chi_tiet_hoa_don_id, so_luong_tra, ly_do)
                VALUES (:tra_hang_id, :chi_tiet_hoa_don_id, :so_luong_tra, :ly_do)";
        return $this->db->prepare($sql)->execute($data);
    }
}

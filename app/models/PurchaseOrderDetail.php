<?php
// app/models/PurchaseOrderDetail.php
require_once __DIR__ . '/BaseModel.php';

class PurchaseOrderDetail extends BaseModel {
    protected $table = 'chi_tiet_nhap_kho';
    
    public function create($data) {
        $sql = "INSERT INTO chi_tiet_nhap_kho (phieu_nhap_id, san_pham_id, so_luong, don_gia_nhap) 
                VALUES (:phieu_nhap_id, :san_pham_id, :so_luong, :don_gia_nhap)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($data);
    }
}
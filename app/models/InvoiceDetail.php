<?php
// app/models/InvoiceDetail.php
require_once __DIR__ . '/BaseModel.php';

class InvoiceDetail extends BaseModel {
    protected $table = 'chi_tiet_hoa_don';
    
    public function create($data) {
        $sql = "INSERT INTO chi_tiet_hoa_don (hoa_don_id, san_pham_id, so_luong, don_gia, thanh_tien) 
                VALUES (:hoa_don_id, :san_pham_id, :so_luong, :don_gia, :thanh_tien)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($data);
    }
    
    public function getByInvoiceId($invoiceId) {
        $sql = "SELECT ct.*, sp.ten_sp, sp.ma_sp 
                FROM chi_tiet_hoa_don ct
                JOIN san_pham sp ON ct.san_pham_id = sp.id
                WHERE ct.hoa_don_id = :invoice_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['invoice_id' => $invoiceId]);
        return $stmt->fetchAll();
    }
}
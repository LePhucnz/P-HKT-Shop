<?php
// app/models/PurchaseOrder.php
require_once __DIR__ . '/BaseModel.php';

class PurchaseOrder extends BaseModel {
    protected $table = 'phieu_nhap_kho';
    
    public function createOrder($supplier, $userId, $items) {
        try {
            $this->db->beginTransaction();
            
            // Tạo phiếu nhập
            $orderNumber = 'PN' . date('YmdHis');
            $sql = "INSERT INTO phieu_nhap_kho (so_pn, nha_cung_cap, nhan_vien_id) 
                    VALUES (:so_pn, :nha_cung_cap, :nhan_vien_id)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'so_pn' => $orderNumber,
                'nha_cung_cap' => $supplier,
                'nhan_vien_id' => $userId
            ]);
            
            $orderId = $this->db->lastInsertId();
            
            // Thêm chi tiết và cộng tồn kho
            $detailModel = new PurchaseOrderDetail();
            $productModel = new Product();
            
            foreach ($items as $item) {
                $detailModel->create([
                    'phieu_nhap_id' => $orderId,
                    'san_pham_id' => $item['product_id'],
                    'so_luong' => $item['quantity'],
                    'don_gia_nhap' => $item['price']
                ]);
                
                $productModel->increaseStock($item['product_id'], $item['quantity']);
            }
            
            $this->db->commit();
            return $orderId;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Lấy phiếu nhập kèm chi tiết
    public function getOrderWithDetails($id) {
        $sql = "SELECT p.*, u.ho_ten as ten_nv
                FROM phieu_nhap_kho p
                LEFT JOIN users u ON p.nhan_vien_id = u.id
                WHERE p.id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $order = $stmt->fetch();

        if ($order) {
            $sql2 = "SELECT ct.*, sp.ten_sp, sp.ma_sp, sp.don_vi_tinh
                     FROM chi_tiet_nhap_kho ct
                     JOIN san_pham sp ON ct.san_pham_id = sp.id
                     WHERE ct.phieu_nhap_id = :id";
            $stmt2 = $this->db->prepare($sql2);
            $stmt2->execute(['id' => $id]);
            $order['details'] = $stmt2->fetchAll();
        }
        return $order;
    }

    // Xóa phiếu nhập + hoàn lại tồn kho (transaction)
    public function deleteOrder($id) {
        try {
            $this->db->beginTransaction();

            // Lấy chi tiết để trừ lại tồn kho đã cộng
            $stmt = $this->db->prepare(
                "SELECT san_pham_id, so_luong FROM chi_tiet_nhap_kho WHERE phieu_nhap_id = :id"
            );
            $stmt->execute(['id' => $id]);
            $details = $stmt->fetchAll();

            $productModel = new Product();
            foreach ($details as $d) {
                $productModel->decreaseStock($d['san_pham_id'], $d['so_luong']);
            }

            // Xóa phiếu (chi_tiet_nhap_kho có ON DELETE CASCADE)
            $this->db->prepare("DELETE FROM phieu_nhap_kho WHERE id = :id")
                     ->execute(['id' => $id]);

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
<?php
// app/models/Invoice.php
require_once __DIR__ . '/BaseModel.php';

class Invoice extends BaseModel {
    protected $table = 'hoa_don';
    
    // Tạo mã hóa đơn tự động
    public function generateInvoiceNumber() {
        return 'HD' . date('YmdHis') . rand(100, 999);
    }
    
    // Tạo hóa đơn mới (có transaction)
    public function createInvoice($customerId, $userId, $paymentMethod, $cart, $discount = 0) {
        try {
            // Bắt đầu transaction
            $this->db->beginTransaction();
            
            // Tính tổng tiền
            $total = 0;
            foreach ($cart as $item) {
                $total += $item['price'] * $item['quantity'];
            }
            $finalTotal = $total - $discount;
            
            // 1. Tạo hóa đơn
            $invoiceNumber = $this->generateInvoiceNumber();
            $sql = "INSERT INTO hoa_don (so_hd, khach_hang_id, nhan_vien_id, phuong_thuc_tt, tong_tien, giam_gia, thanh_tien) 
                    VALUES (:so_hd, :khach_hang_id, :nhan_vien_id, :phuong_thuc_tt, :tong_tien, :giam_gia, :thanh_tien)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'so_hd' => $invoiceNumber,
                'khach_hang_id' => $customerId ?: null,
                'nhan_vien_id' => $userId,
                'phuong_thuc_tt' => $paymentMethod,
                'tong_tien' => $total,
                'giam_gia' => $discount,
                'thanh_tien' => $finalTotal
            ]);
            
            $invoiceId = $this->db->lastInsertId();
            
            // 2. Thêm chi tiết hóa đơn và trừ tồn kho
            $invoiceDetailModel = new InvoiceDetail();
            $productModel = new Product();
            
            foreach ($cart as $productId => $item) {
                // Thêm chi tiết
                $invoiceDetailModel->create([
                    'hoa_don_id' => $invoiceId,
                    'san_pham_id' => $productId,
                    'so_luong' => $item['quantity'],
                    'don_gia' => $item['price'],
                    'thanh_tien' => $item['price'] * $item['quantity']
                ]);
                
                // Trừ tồn kho
                $productModel->decreaseStock($productId, $item['quantity']);
            }
            
            // 3. Cập nhật điểm tích lũy cho khách hàng
            if ($customerId) {
                $customerModel = new Customer();
                $points = floor($finalTotal / 1000) * 10;
                $customerModel->addPoints($customerId, $points);
            }
            
            // Commit transaction
            $this->db->commit();
            
            return $invoiceId;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    // Lấy hóa đơn kèm chi tiết
    public function getInvoiceWithDetails($id) {
        $sql = "SELECT hd.*, kh.ho_ten as khach_ten, kh.so_dien_thoai, nv.ho_ten as nhan_vien_ten
                FROM hoa_don hd
                LEFT JOIN khach_hang kh ON hd.khach_hang_id = kh.id
                LEFT JOIN users nv ON hd.nhan_vien_id = nv.id
                WHERE hd.id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $invoice = $stmt->fetch();
        
        if ($invoice) {
            $detailModel = new InvoiceDetail();
            $invoice['details'] = $detailModel->getByInvoiceId($id);
        }
        
        return $invoice;
    }
    
    // Xoa hoa don va hoan lai ton kho (chi admin)
    public function deleteInvoice($id) {
        try {
            $this->db->beginTransaction();

            $invoice = $this->find($id);

            // Hoan ton kho
            $stmt = $this->db->prepare("SELECT * FROM chi_tiet_hoa_don WHERE hoa_don_id = :id");
            $stmt->execute(['id' => $id]);
            $details = $stmt->fetchAll();

            $productModel = new Product();
            foreach ($details as $d) {
                $productModel->increaseStock($d['san_pham_id'], $d['so_luong']);
            }

            // Neu hoa don duoc tao tu don hang -> tra don hang ve pending
            if ($invoice && !empty($invoice['don_hang_id'])) {
                $this->db->prepare("UPDATE don_hang SET trang_thai='pending' WHERE id=:id")
                         ->execute(['id' => $invoice['don_hang_id']]);
            }

            $this->delete($id);
            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Lấy danh sách hóa đơn
    public function getAllWithCustomer() {
        $sql = "SELECT hd.*, kh.ho_ten as khach_ten 
                FROM hoa_don hd 
                LEFT JOIN khach_hang kh ON hd.khach_hang_id = kh.id 
                ORDER BY hd.ngay_lap DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
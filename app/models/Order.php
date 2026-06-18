<?php
require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/Product.php';
require_once __DIR__ . '/Invoice.php';
require_once __DIR__ . '/InvoiceDetail.php';
require_once __DIR__ . '/Customer.php';

class Order extends BaseModel {
    protected $table = 'don_hang';

    public function generateOrderNumber() {
        return 'DH' . date('YmdHis') . rand(100, 999);
    }

    // Danh sach don hang kem ten khach
    public function getAllWithCustomer() {
        return $this->db->query(
            "SELECT dh.*, kh.ho_ten as khach_ten
             FROM don_hang dh
             LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id
             ORDER BY dh.id DESC"
        )->fetchAll();
    }

    // Don hang kem chi tiet
    public function getOrderWithDetails($id) {
        $stmt = $this->db->prepare(
            "SELECT dh.*, kh.ho_ten as khach_ten, kh.so_dien_thoai, nv.ho_ten as nhan_vien_ten
             FROM don_hang dh
             LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id
             LEFT JOIN users nv ON dh.nhan_vien_id = nv.id
             WHERE dh.id = :id"
        );
        $stmt->execute(['id' => $id]);
        $order = $stmt->fetch();
        if (!$order) return null;

        $stmt = $this->db->prepare(
            "SELECT ct.*, sp.ten_sp, sp.ma_sp
             FROM chi_tiet_don_hang ct
             JOIN san_pham sp ON ct.san_pham_id = sp.id
             WHERE ct.don_hang_id = :id"
        );
        $stmt->execute(['id' => $id]);
        $order['details'] = $stmt->fetchAll();

        // Neu da thanh toan, lay hoa don lien quan
        $stmt = $this->db->prepare("SELECT id, so_hd FROM hoa_don WHERE don_hang_id = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $order['hoa_don'] = $stmt->fetch() ?: null;

        return $order;
    }

    // Tao don hang moi (KHONG tru ton kho - chi la yeu cau mua)
    // $cart: [ san_pham_id => ['price'=>.., 'quantity'=>..], ... ]
    public function createOrder($customerId, $userId, $cart, $discount = 0) {
        try {
            $this->db->beginTransaction();

            $total = 0;
            foreach ($cart as $item) {
                $total += $item['price'] * $item['quantity'];
            }
            $finalTotal = $total - $discount;

            $sql = "INSERT INTO don_hang (so_dh, khach_hang_id, nhan_vien_id, tong_tien, giam_gia, thanh_tien, trang_thai)
                    VALUES (:so_dh, :khach_hang_id, :nhan_vien_id, :tong_tien, :giam_gia, :thanh_tien, 'pending')";
            $this->db->prepare($sql)->execute([
                'so_dh'         => $this->generateOrderNumber(),
                'khach_hang_id' => $customerId ?: null,
                'nhan_vien_id'  => $userId,
                'tong_tien'     => $total,
                'giam_gia'      => $discount,
                'thanh_tien'    => $finalTotal,
            ]);
            $orderId = $this->db->lastInsertId();

            $detailStmt = $this->db->prepare(
                "INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
                 VALUES (:don_hang_id, :san_pham_id, :so_luong, :don_gia, :thanh_tien)"
            );
            foreach ($cart as $productId => $item) {
                $detailStmt->execute([
                    'don_hang_id' => $orderId,
                    'san_pham_id' => $productId,
                    'so_luong'    => $item['quantity'],
                    'don_gia'     => $item['price'],
                    'thanh_tien'  => $item['price'] * $item['quantity'],
                ]);
            }

            $this->db->commit();
            return $orderId;

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // THANH TOAN don hang -> sinh HOA DON, tru ton kho, tich diem.
    // Tra ve invoiceId.
    public function payOrder($orderId, $paymentMethod) {
        try {
            $this->db->beginTransaction();

            // Khoa don hang
            $stmt = $this->db->prepare("SELECT * FROM don_hang WHERE id = :id FOR UPDATE");
            $stmt->execute(['id' => $orderId]);
            $order = $stmt->fetch();

            if (!$order) throw new Exception('Don hang khong ton tai');
            if ($order['trang_thai'] === 'paid')      throw new Exception('Don hang da duoc thanh toan');
            if ($order['trang_thai'] === 'cancelled')  throw new Exception('Don hang da bi huy, khong the thanh toan');

            // Lay chi tiet don
            $stmt = $this->db->prepare("SELECT * FROM chi_tiet_don_hang WHERE don_hang_id = :id");
            $stmt->execute(['id' => $orderId]);
            $details = $stmt->fetchAll();
            if (empty($details)) throw new Exception('Don hang khong co san pham');

            $productModel = new Product();

            // Kiem tra ton kho truoc khi tru
            foreach ($details as $d) {
                $p = $productModel->find($d['san_pham_id']);
                if (!$p || $p['so_luong_ton'] < $d['so_luong']) {
                    throw new Exception("San pham id={$d['san_pham_id']} khong du ton kho de thanh toan");
                }
            }

            // 1. Tao hoa don
            $invoiceNumber = 'HD' . date('YmdHis') . rand(100, 999);
            $sql = "INSERT INTO hoa_don (don_hang_id, so_hd, khach_hang_id, nhan_vien_id, phuong_thuc_tt, tong_tien, giam_gia, thanh_tien, trang_thai)
                    VALUES (:don_hang_id, :so_hd, :khach_hang_id, :nhan_vien_id, :phuong_thuc_tt, :tong_tien, :giam_gia, :thanh_tien, 'completed')";
            $this->db->prepare($sql)->execute([
                'don_hang_id'    => $orderId,
                'so_hd'          => $invoiceNumber,
                'khach_hang_id'  => $order['khach_hang_id'],
                'nhan_vien_id'   => $order['nhan_vien_id'],
                'phuong_thuc_tt' => $paymentMethod,
                'tong_tien'      => $order['tong_tien'],
                'giam_gia'       => $order['giam_gia'],
                'thanh_tien'     => $order['thanh_tien'],
            ]);
            $invoiceId = $this->db->lastInsertId();

            // 2. Them chi tiet hoa don + tru ton kho
            $invDetail = new InvoiceDetail();
            foreach ($details as $d) {
                $invDetail->create([
                    'hoa_don_id'  => $invoiceId,
                    'san_pham_id' => $d['san_pham_id'],
                    'so_luong'    => $d['so_luong'],
                    'don_gia'     => $d['don_gia'],
                    'thanh_tien'  => $d['thanh_tien'],
                ]);
                $productModel->decreaseStock($d['san_pham_id'], $d['so_luong']);
            }

            // 3. Tich diem cho khach
            if ($order['khach_hang_id']) {
                $points = floor($order['thanh_tien'] / 1000) * 10;
                (new Customer())->addPoints($order['khach_hang_id'], $points);
            }

            // 4. Cap nhat trang thai don hang
            $this->db->prepare("UPDATE don_hang SET trang_thai = 'paid' WHERE id = :id")
                     ->execute(['id' => $orderId]);

            $this->db->commit();
            return $invoiceId;

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Cap nhat don hang pending (xoa va insert lai chi tiet)
    public function updateOrder($orderId, $customerId, $discount, $cart) {
        try {
            $this->db->beginTransaction();

            $this->db->prepare("DELETE FROM chi_tiet_don_hang WHERE don_hang_id = :id")
                     ->execute(['id' => $orderId]);

            $total = 0;
            foreach ($cart as $item) {
                $total += $item['price'] * $item['quantity'];
            }
            $finalTotal = max(0, $total - $discount);

            $this->db->prepare(
                "UPDATE don_hang SET khach_hang_id=:kh, giam_gia=:gd, tong_tien=:tt, thanh_tien=:th WHERE id=:id"
            )->execute([
                'kh' => $customerId,
                'gd' => $discount,
                'tt' => $total,
                'th' => $finalTotal,
                'id' => $orderId,
            ]);

            $stmt = $this->db->prepare(
                "INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
                 VALUES (:don_hang_id, :san_pham_id, :so_luong, :don_gia, :thanh_tien)"
            );
            foreach ($cart as $productId => $item) {
                $stmt->execute([
                    'don_hang_id' => $orderId,
                    'san_pham_id' => $productId,
                    'so_luong'    => $item['quantity'],
                    'don_gia'     => $item['price'],
                    'thanh_tien'  => $item['price'] * $item['quantity'],
                ]);
            }

            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Huy don hang (chi khi dang pending). Khong dung ton kho vi chua tru.
    public function cancelOrder($orderId) {
        $order = $this->find($orderId);
        if (!$order) throw new Exception('Don hang khong ton tai');
        if ($order['trang_thai'] === 'paid')      throw new Exception('Khong the huy don da thanh toan');
        if ($order['trang_thai'] === 'cancelled')  throw new Exception('Don hang da bi huy truoc do');

        return $this->db->prepare("UPDATE don_hang SET trang_thai = 'cancelled' WHERE id = :id")
                        ->execute(['id' => $orderId]);
    }
}

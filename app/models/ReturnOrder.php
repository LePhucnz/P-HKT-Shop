<?php
require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/Product.php';

class ReturnOrder extends BaseModel {
    protected $table = 'tra_hang';

    public function create($data) {
        $sql = "INSERT INTO tra_hang (hoa_don_id, ngay_tra, ly_do, so_tien_hoan, phuong_thuc_hoan, trang_thai)
                VALUES (:hoa_don_id, :ngay_tra, :ly_do, :so_tien_hoan, :phuong_thuc_hoan, :trang_thai)";
        return $this->db->prepare($sql)->execute($data);
    }

    public function getWithInvoice($id) {
        $stmt = $this->db->prepare(
            "SELECT th.*, hd.so_hd FROM tra_hang th
             LEFT JOIN hoa_don hd ON th.hoa_don_id=hd.id WHERE th.id=:id"
        );
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    // Danh sach phieu tra kem ma hoa don
    public function allWithInvoice() {
        return $this->db->query(
            "SELECT th.*, hd.so_hd FROM tra_hang th
             LEFT JOIN hoa_don hd ON th.hoa_don_id=hd.id
             ORDER BY th.id DESC"
        )->fetchAll();
    }

    // Chi tiet 1 phieu tra (kem ten san pham)
    public function getDetails($returnId) {
        $stmt = $this->db->prepare(
            "SELECT cttr.*, ct.san_pham_id, ct.don_gia, sp.ten_sp, sp.ma_sp
             FROM chi_tiet_tra_hang cttr
             JOIN chi_tiet_hoa_don ct ON cttr.chi_tiet_hoa_don_id = ct.id
             JOIN san_pham sp ON ct.san_pham_id = sp.id
             WHERE cttr.tra_hang_id = :id"
        );
        $stmt->execute(['id' => $returnId]);
        return $stmt->fetchAll();
    }

    // Tao phieu tra hang co transaction:
    // - Tinh so tien hoan tu don_gia * so_luong_tra cua tung dong hoa don
    // - Cong lai ton kho (restock)
    // - Khong cho tra qua so luong da mua
    //
    // $items: [ { "chi_tiet_hoa_don_id": 5, "so_luong_tra": 2 }, ... ]
    public function createReturn($invoiceId, $items, $lyDo, $phuongThucHoan, $trangThai = 'completed') {
        try {
            $this->db->beginTransaction();

            $productModel = new Product();
            $totalRefund  = 0;
            $validItems   = [];

            foreach ($items as $it) {
                $ctId = $it['chi_tiet_hoa_don_id'] ?? null;
                $qty  = (int)($it['so_luong_tra'] ?? 0);
                if (!$ctId || $qty <= 0) continue;

                // Lay dong hoa don, dam bao thuoc dung hoa don nay
                $stmt = $this->db->prepare(
                    "SELECT id, san_pham_id, so_luong, don_gia
                     FROM chi_tiet_hoa_don WHERE id = :id AND hoa_don_id = :hd"
                );
                $stmt->execute(['id' => $ctId, 'hd' => $invoiceId]);
                $line = $stmt->fetch();
                if (!$line) {
                    throw new Exception("Dong hoa don id=$ctId khong thuoc hoa don nay");
                }

                // Kiem tra so luong da tra truoc do
                $stmt = $this->db->prepare(
                    "SELECT COALESCE(SUM(so_luong_tra),0) FROM chi_tiet_tra_hang
                     WHERE chi_tiet_hoa_don_id = :id"
                );
                $stmt->execute(['id' => $ctId]);
                $daTra = (int)$stmt->fetchColumn();

                if ($daTra + $qty > (int)$line['so_luong']) {
                    throw new Exception(
                        "San pham (dong #$ctId) chi co the tra toi da " . ((int)$line['so_luong'] - $daTra) . " sp"
                    );
                }

                $totalRefund += $line['don_gia'] * $qty;
                $validItems[] = [
                    'chi_tiet_hoa_don_id' => $ctId,
                    'san_pham_id'         => $line['san_pham_id'],
                    'so_luong_tra'        => $qty,
                ];
            }

            if (empty($validItems)) {
                throw new Exception('Khong co san pham hop le de tra');
            }

            // 1. Tao phieu tra
            $this->create([
                'hoa_don_id'       => $invoiceId,
                'ngay_tra'         => date('Y-m-d H:i:s'),
                'ly_do'            => $lyDo,
                'so_tien_hoan'     => $totalRefund,
                'phuong_thuc_hoan' => $phuongThucHoan,
                'trang_thai'       => $trangThai,
            ]);
            $returnId = $this->db->lastInsertId();

            // 2. Them chi tiet + cong lai ton kho
            $detailStmt = $this->db->prepare(
                "INSERT INTO chi_tiet_tra_hang (tra_hang_id, chi_tiet_hoa_don_id, so_luong_tra, ly_do)
                 VALUES (:tra_hang_id, :chi_tiet_hoa_don_id, :so_luong_tra, :ly_do)"
            );
            foreach ($validItems as $vi) {
                $detailStmt->execute([
                    'tra_hang_id'         => $returnId,
                    'chi_tiet_hoa_don_id' => $vi['chi_tiet_hoa_don_id'],
                    'so_luong_tra'        => $vi['so_luong_tra'],
                    'ly_do'               => $lyDo,
                ]);
                $productModel->increaseStock($vi['san_pham_id'], $vi['so_luong_tra']);
            }

            $this->db->commit();
            return $returnId;

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}

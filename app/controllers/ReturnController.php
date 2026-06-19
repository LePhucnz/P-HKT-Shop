<?php
require_once __DIR__ . '/../models/ReturnOrder.php';
require_once __DIR__ . '/../models/ReturnDetail.php';
require_once __DIR__ . '/../models/Invoice.php';
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/Request.php';
require_once __DIR__ . '/../../core/Auth.php';

class ReturnController {

    private function guard() {
        return Auth::requireRole([ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER]);
    }

    // GET /api/returns  - lich su doi/tra
    public function index() {
        $this->guard();
        Response::success((new ReturnOrder())->allWithInvoice(), 'Danh sach phieu tra hang');
    }

    // GET /api/returns/{id}  - chi tiet 1 phieu tra
    public function show($id) {
        $this->guard();
        $model  = new ReturnOrder();
        $return = $model->getWithInvoice($id);
        if (!$return) Response::error('Khong tim thay phieu tra', 404);
        $return['details'] = $model->getDetails($id);
        Response::success($return, 'Chi tiet phieu tra');
    }

    // GET /api/returns/invoice/{invoiceId}
    // Tra ve hoa don + chi tiet de chon san pham can tra (thay cho form tim hoa don)
    public function byInvoice($invoiceId) {
        $this->guard();
        $invoice = (new Invoice())->getInvoiceWithDetails($invoiceId);
        if (!$invoice) Response::error('Khong tim thay hoa don', 404);
        Response::success($invoice, 'Hoa don can tra');
    }

    // POST /api/returns  - tao phieu tra hang
    // Body:
    // {
    //   "hoa_don_id": 1,
    //   "ly_do": "San pham loi",
    //   "phuong_thuc_hoan": "Tien mat",
    //   "items": [ { "chi_tiet_hoa_don_id": 5, "so_luong_tra": 1 } ]
    // }
    public function store() {
        $this->guard();
        $data = Request::validate(['hoa_don_id', 'ly_do', 'phuong_thuc_hoan']);

        $invoiceId = (int)$data['hoa_don_id'];
        $items     = $data['items'] ?? [];
        if (empty($items) || !is_array($items)) {
            Response::error('Vui long chon it nhat mot san pham de tra (items rong)', 422);
        }

        // Kiem tra hoa don ton tai
        if (!(new Invoice())->find($invoiceId)) {
            Response::error('Hoa don khong ton tai', 404);
        }

        try {
            $returnId = (new ReturnOrder())->createReturn(
                $invoiceId,
                $items,
                trim($data['ly_do']),
                $data['phuong_thuc_hoan'],
                $data['trang_thai'] ?? 'completed'
            );
            $model  = new ReturnOrder();
            $return = $model->getWithInvoice($returnId);
            $return['details'] = $model->getDetails($returnId);
            Response::success($return, 'Tao phieu tra hang thanh cong', 201);
        } catch (Exception $e) {
            Response::error('Loi tra hang: ' . $e->getMessage(), 422);
        }
    }
}

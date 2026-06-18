<?php
require_once __DIR__ . '/../models/Product.php';
require_once __DIR__ . '/../models/Customer.php';
require_once __DIR__ . '/../models/Invoice.php';
require_once __DIR__ . '/../models/InvoiceDetail.php';
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/Request.php';
require_once __DIR__ . '/../../core/Auth.php';

class InvoiceController {

    // GET /api/invoices
    public function index() {
        Auth::requireRole([ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER]);
        $invoices = (new Invoice())->getAllWithCustomer();
        Response::success($invoices, 'Danh sach hoa don');
    }

    // GET /api/invoices/{id}  (kem chi tiet)
    public function show($id) {
        Auth::requireRole([ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER]);
        $invoice = (new Invoice())->getInvoiceWithDetails($id);
        if (!$invoice) Response::error('Khong tim thay hoa don', 404);
        Response::success($invoice, 'Chi tiet hoa don');
    }

    // DELETE /api/invoices/{id} - chi admin, hoan lai ton kho
    public function destroy($id) {
        Auth::requireRole([ROLE_ADMIN]);
        $invoice = (new Invoice())->find($id);
        if (!$invoice) Response::error('Khong tim thay hoa don', 404);

        try {
            (new Invoice())->deleteInvoice($id);
            Response::success(null, 'Da xoa hoa don va hoan lai ton kho');
        } catch (Exception $e) {
            Response::error('Loi xoa hoa don: ' . $e->getMessage(), 500);
        }
    }

    // POST /api/invoices  - tao hoa don (thanh toan)
    // Body JSON:
    // {
    //   "khach_hang_id": 1 | null,
    //   "phuong_thuc_tt": "cash",
    //   "giam_gia": 0,
    //   "items": [ { "san_pham_id": 5, "so_luong": 2 }, ... ]
    // }
    public function store() {
        $user = Auth::requireRole([ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER]);
        $data = Request::body();

        $items = $data['items'] ?? [];
        if (empty($items) || !is_array($items)) {
            Response::error('Gio hang trong (items rong)', 422);
        }

        $productModel = new Product();

        // Dung lai dinh dang cart ma model Invoice::createInvoice yeu cau:
        // [ san_pham_id => ['price'=>.., 'quantity'=>.., 'name'=>..], ... ]
        $cart = [];
        foreach ($items as $it) {
            $pid = $it['san_pham_id'] ?? null;
            $qty = (int)($it['so_luong'] ?? 0);
            if (!$pid || $qty <= 0) continue;

            $product = $productModel->find($pid);
            if (!$product) {
                Response::error("San pham id=$pid khong ton tai", 422);
            }
            if ($product['so_luong_ton'] < $qty) {
                Response::error("San pham '{$product['ten_sp']}' khong du ton kho", 422);
            }
            $cart[$pid] = [
                'name'     => $product['ten_sp'],
                'price'    => (float)$product['gia_ban'],
                'quantity' => $qty,
            ];
        }

        if (empty($cart)) Response::error('Khong co dong hang hop le', 422);

        $customerId    = ($data['khach_hang_id'] ?? null) ?: null;
        $paymentMethod = $data['phuong_thuc_tt'] ?? 'cash';
        $discount      = (float)($data['giam_gia'] ?? 0);

        try {
            $invoiceId = (new Invoice())->createInvoice(
                $customerId,
                $user['sub'],
                $paymentMethod,
                $cart,
                $discount
            );
            $invoice = (new Invoice())->getInvoiceWithDetails($invoiceId);
            Response::success($invoice, 'Tao hoa don thanh cong', 201);
        } catch (Exception $e) {
            Response::error('Loi tao hoa don: ' . $e->getMessage(), 500);
        }
    }
}

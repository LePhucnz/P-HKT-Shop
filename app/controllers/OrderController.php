<?php
require_once __DIR__ . '/../models/Order.php';
require_once __DIR__ . '/../models/Product.php';
require_once __DIR__ . '/../models/Invoice.php';
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/Request.php';
require_once __DIR__ . '/../../core/Auth.php';

class OrderController {

    private function guard() {
        return Auth::requireRole([ROLE_ADMIN, ROLE_MANAGER, ROLE_CASHIER]);
    }

    // GET /api/orders
    public function index() {
        $this->guard();
        Response::success((new Order())->getAllWithCustomer(), 'Danh sach don hang');
    }

    // GET /api/orders/{id}
    public function show($id) {
        $this->guard();
        $order = (new Order())->getOrderWithDetails($id);
        if (!$order) Response::error('Khong tim thay don hang', 404);
        Response::success($order, 'Chi tiet don hang');
    }

    // POST /api/orders  - tao don hang (chua thanh toan)
    // Body:
    // {
    //   "khach_hang_id": 1 | null,
    //   "giam_gia": 0,
    //   "items": [ { "san_pham_id": 1, "so_luong": 2 } ]
    // }
    public function store() {
        $user = $this->guard();
        $data = Request::body();

        $items = $data['items'] ?? [];
        if (empty($items) || !is_array($items)) {
            Response::error('Don hang phai co it nhat mot san pham (items rong)', 422);
        }

        $productModel = new Product();
        $cart = [];
        foreach ($items as $it) {
            $pid = $it['san_pham_id'] ?? null;
            $qty = (int)($it['so_luong'] ?? 0);
            if (!$pid || $qty <= 0) continue;

            $product = $productModel->find($pid);
            if (!$product) Response::error("San pham id=$pid khong ton tai", 422);
            // Chi canh bao neu khong du, van cho dat (kho se kiem tra lai khi thanh toan)
            $cart[$pid] = [
                'price'    => (float)$product['gia_ban'],
                'quantity' => $qty,
            ];
        }
        if (empty($cart)) Response::error('Khong co dong hang hop le', 422);

        $customerId = ($data['khach_hang_id'] ?? null) ?: null;
        $discount   = (float)($data['giam_gia'] ?? 0);

        try {
            $orderId = (new Order())->createOrder($customerId, $user['sub'], $cart, $discount);
            $order   = (new Order())->getOrderWithDetails($orderId);
            Response::success($order, 'Tao don hang thanh cong (cho thanh toan)', 201);
        } catch (Exception $e) {
            Response::error('Loi tao don hang: ' . $e->getMessage(), 500);
        }
    }

    // POST /api/orders/{id}/pay  - thanh toan -> sinh hoa don
    // Body: { "phuong_thuc_tt": "Tiền mặt" }
    public function pay($id) {
        $this->guard();
        $data   = Request::body();
        $method = $data['phuong_thuc_tt'] ?? 'Tiền mặt';

        try {
            $invoiceId = (new Order())->payOrder($id, $method);
            $invoice   = (new Invoice())->getInvoiceWithDetails($invoiceId);
            Response::success($invoice, 'Thanh toan thanh cong, da tao hoa don', 201);
        } catch (Exception $e) {
            Response::error('Loi thanh toan: ' . $e->getMessage(), 422);
        }
    }

    // PUT /api/orders/{id} - sua don hang pending (xay dung lai items)
    public function update($id) {
        $this->guard();
        $order = (new Order())->find($id);
        if (!$order) Response::error('Khong tim thay don hang', 404);
        if ($order['trang_thai'] !== 'pending') {
            Response::error('Chi co the sua don hang dang cho thanh toan', 422);
        }

        $data  = Request::body();
        $items = $data['items'] ?? [];
        if (empty($items) || !is_array($items)) {
            Response::error('Don hang phai co it nhat mot san pham', 422);
        }

        $productModel = new Product();
        $cart = [];
        foreach ($items as $it) {
            $pid = $it['san_pham_id'] ?? null;
            $qty = (int)($it['so_luong'] ?? 0);
            if (!$pid || $qty <= 0) continue;
            $product = $productModel->find($pid);
            if (!$product) Response::error("San pham id=$pid khong ton tai", 422);
            $cart[$pid] = ['price' => (float)$product['gia_ban'], 'quantity' => $qty];
        }
        if (empty($cart)) Response::error('Khong co dong hang hop le', 422);

        $customerId = ($data['khach_hang_id'] ?? null) ?: null;
        $discount   = (float)($data['giam_gia'] ?? 0);

        try {
            (new Order())->updateOrder($id, $customerId, $discount, $cart);
            $updated = (new Order())->getOrderWithDetails($id);
            Response::success($updated, 'Cap nhat don hang thanh cong');
        } catch (Exception $e) {
            Response::error('Loi cap nhat don hang: ' . $e->getMessage(), 500);
        }
    }

    // DELETE /api/orders/{id} - admin/manager, khong xoa don da thanh toan
    public function destroy($id) {
        Auth::requireRole([ROLE_ADMIN, ROLE_MANAGER]);
        $order = (new Order())->find($id);
        if (!$order) Response::error('Khong tim thay don hang', 404);
        if ($order['trang_thai'] === 'paid') {
            Response::error('Khong the xoa don hang da thanh toan. Xoa hoa don truoc neu can.', 422);
        }
        (new Order())->delete($id);
        Response::success(null, 'Da xoa don hang');
    }

    // POST /api/orders/{id}/cancel  - huy don pending
    public function cancel($id) {
        $this->guard();
        try {
            (new Order())->cancelOrder($id);
            Response::success(null, 'Da huy don hang');
        } catch (Exception $e) {
            Response::error('Loi huy don: ' . $e->getMessage(), 422);
        }
    }
}

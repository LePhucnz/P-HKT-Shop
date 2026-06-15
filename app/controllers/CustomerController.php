<?php
require_once __DIR__ . '/../models/Customer.php';
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/Request.php';
require_once __DIR__ . '/../../core/Auth.php';

class CustomerController {

    // GET /api/customers?search=&hang_thanh_vien=
    public function index() {
        Auth::requireLogin();
        $model  = new Customer();
        $search = Request::query('search', '');
        $hang   = Request::query('hang_thanh_vien', '');
        $rows   = $search ? $model->search($search)
                : ($hang ? $model->filterByRank($hang) : $model->all());
        Response::success($rows, 'Danh sach khach hang');
    }

    // GET /api/customers/{id}  (kem hoa don, tong chi tieu)
    public function show($id) {
        Auth::requireLogin();
        $model    = new Customer();
        $customer = $model->find($id);
        if (!$customer) Response::error('Khong tim thay khach hang', 404);
        Response::success([
            'customer'    => $customer,
            'invoices'    => $model->getInvoices($id),
            'total_spent' => $model->getTotalSpent($id),
            'history'     => $model->getPointHistory($id),
        ], 'Chi tiet khach hang');
    }

    // POST /api/customers
    public function store() {
        Auth::requireLogin();
        $data = Request::validate(['ho_ten', 'so_dien_thoai']);
        $model = new Customer();
        $payload = [
            'ho_ten'        => trim($data['ho_ten']),
            'so_dien_thoai' => trim($data['so_dien_thoai']),
            'email'         => trim($data['email'] ?? ''),
            'ngay_sinh'     => ($data['ngay_sinh'] ?? '') ?: null,
            'dia_chi'       => trim($data['dia_chi'] ?? ''),
            'gioi_tinh'     => $data['gioi_tinh'] ?? '',
        ];
        if (!$model->create($payload)) Response::error('Them khach hang that bai', 500);
        Response::success(null, 'Them khach hang thanh cong', 201);
    }

    // PUT /api/customers/{id}
    public function update($id) {
        Auth::requireLogin();
        $model = new Customer();
        if (!$model->find($id)) Response::error('Khong tim thay khach hang', 404);
        $data = Request::body();
        $payload = [
            'ho_ten'        => trim($data['ho_ten'] ?? ''),
            'so_dien_thoai' => trim($data['so_dien_thoai'] ?? ''),
            'email'         => trim($data['email'] ?? ''),
            'ngay_sinh'     => ($data['ngay_sinh'] ?? '') ?: null,
            'dia_chi'       => trim($data['dia_chi'] ?? ''),
            'gioi_tinh'     => $data['gioi_tinh'] ?? '',
        ];
        if (!$model->update($id, $payload)) Response::error('Cap nhat that bai', 500);
        Response::success(null, 'Cap nhat khach hang thanh cong');
    }

    // DELETE /api/customers/{id}
    public function destroy($id) {
        Auth::requireLogin();
        $model = new Customer();
        if (!$model->find($id)) Response::error('Khong tim thay khach hang', 404);
        if ($model->hasInvoices($id)) {
            Response::error('Khong the xoa khach hang da co hoa don', 409);
        }
        if (!$model->delete($id)) Response::error('Xoa that bai', 500);
        Response::success(null, 'Xoa khach hang thanh cong');
    }
}

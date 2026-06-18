<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/Request.php';
require_once __DIR__ . '/../../core/Auth.php';

class ReportController {

    private function guard() {
        return Auth::requireRole([ROLE_ADMIN, ROLE_MANAGER]);
    }

    // GET /api/reports/revenue?start_date=&end_date=
    public function revenue() {
        $this->guard();
        $start = Request::query('start_date', date('Y-m-01'));
        $end   = Request::query('end_date', date('Y-m-d'));
        $db = Database::getConnection();

        $stmt = $db->prepare(
            "SELECT DATE(ngay_lap) as date, COUNT(*) as total_invoices,
                    SUM(tong_tien) as tong_hang, SUM(giam_gia) as tong_giam,
                    SUM(thanh_tien) as total_revenue
             FROM hoa_don WHERE DATE(ngay_lap) BETWEEN :start AND :end
             GROUP BY DATE(ngay_lap) ORDER BY date DESC"
        );
        $stmt->execute(['start' => $start, 'end' => $end]);
        $daily = $stmt->fetchAll();

        $stmt = $db->prepare(
            "SELECT COALESCE(SUM(thanh_tien),0) as total, COUNT(*) as count,
                    COALESCE(SUM(giam_gia),0) as tong_giam
             FROM hoa_don WHERE DATE(ngay_lap) BETWEEN :start AND :end"
        );
        $stmt->execute(['start' => $start, 'end' => $end]);
        $summary = $stmt->fetch();

        Response::success([
            'start_date' => $start,
            'end_date'   => $end,
            'summary'    => $summary,
            'daily'      => $daily,
        ], 'Bao cao doanh thu');
    }

    // GET /api/reports/inventory?category_id=
    public function inventory() {
        $this->guard();
        $db    = Database::getConnection();
        $catId = Request::query('category_id', '');
        $where  = $catId ? "WHERE sp.danh_muc_id = :cid" : "";
        $params = $catId ? ['cid' => $catId] : [];

        $stmt = $db->prepare(
            "SELECT sp.*, dm.ten_danh_muc FROM san_pham sp
             LEFT JOIN danh_muc dm ON sp.danh_muc_id=dm.id
             $where ORDER BY sp.so_luong_ton ASC"
        );
        $stmt->execute($params);
        $products = $stmt->fetchAll();

        $stats = $db->query(
            "SELECT COUNT(*) as total_products,
             COALESCE(SUM(so_luong_ton * gia_ban),0) as total_value,
             SUM(CASE WHEN so_luong_ton < 10 AND so_luong_ton > 0 THEN 1 ELSE 0 END) as low_stock_count,
             SUM(CASE WHEN so_luong_ton = 0 THEN 1 ELSE 0 END) as out_of_stock_count
             FROM san_pham"
        )->fetch();

        Response::success([
            'stats'    => $stats,
            'products' => $products,
        ], 'Bao cao ton kho');
    }
}

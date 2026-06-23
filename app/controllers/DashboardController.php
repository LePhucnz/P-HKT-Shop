<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../core/Response.php';
require_once __DIR__ . '/../../core/Auth.php';

class DashboardController {

    // GET /api/dashboard
    public function index() {
        Auth::requireLogin();
        $db = Database::getConnection();

        $doanh_thu_hom_nay = $db->query(
            "SELECT COALESCE(SUM(thanh_tien),0) FROM hoa_don WHERE DATE(ngay_lap)=CURDATE() AND trang_thai='completed'"
        )->fetchColumn();

        $hd_hom_nay   = $db->query("SELECT COUNT(*) FROM hoa_don WHERE DATE(ngay_lap)=CURDATE()")->fetchColumn();
        $tong_san_pham = $db->query("SELECT COUNT(*) FROM san_pham")->fetchColumn();
        $sap_het      = $db->query("SELECT COUNT(*) FROM san_pham WHERE so_luong_ton < 10")->fetchColumn();
        $tong_khach   = $db->query("SELECT COUNT(*) FROM khach_hang")->fetchColumn();

        $doanh_thu_thang = $db->query(
            "SELECT COALESCE(SUM(thanh_tien),0) FROM hoa_don
             WHERE MONTH(ngay_lap)=MONTH(CURDATE()) AND YEAR(ngay_lap)=YEAR(CURDATE()) AND trang_thai='completed'"
        )->fetchColumn();

        $hoa_don_gan_day = $db->query(
            "SELECT h.*, kh.ho_ten as ten_kh, u.ho_ten as ten_nv
             FROM hoa_don h
             LEFT JOIN khach_hang kh ON h.khach_hang_id=kh.id
             LEFT JOIN users u ON h.nhan_vien_id=u.id
             ORDER BY h.ngay_lap DESC LIMIT 8"
        )->fetchAll();

        $san_pham_ban_chay = $db->query(
            "SELECT sp.ten_sp, SUM(ct.so_luong) as tong_ban
             FROM chi_tiet_hoa_don ct
             JOIN san_pham sp ON ct.san_pham_id=sp.id
             JOIN hoa_don h ON ct.hoa_don_id=h.id
             WHERE h.trang_thai='completed'
             GROUP BY sp.id ORDER BY tong_ban DESC LIMIT 5"
        )->fetchAll();

        $ds_sap_het = $db->query(
            "SELECT * FROM san_pham WHERE so_luong_ton < 10 ORDER BY so_luong_ton ASC LIMIT 5"
        )->fetchAll();

        Response::success([
            'doanh_thu_hom_nay'  => (float)$doanh_thu_hom_nay,
            'hd_hom_nay'         => (int)$hd_hom_nay,
            'tong_san_pham'      => (int)$tong_san_pham,
            'sap_het'            => (int)$sap_het,
            'tong_khach'         => (int)$tong_khach,
            'doanh_thu_thang'    => (float)$doanh_thu_thang,
            'hoa_don_gan_day'    => $hoa_don_gan_day,
            'san_pham_ban_chay'  => $san_pham_ban_chay,
            'ds_sap_het'         => $ds_sap_het,
        ], 'Dashboard');
    }
}

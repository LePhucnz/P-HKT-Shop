-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for ban_hang
CREATE DATABASE IF NOT EXISTS `ban_hang` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `ban_hang`;

-- Dumping structure for table ban_hang.chi_tiet_don_hang
CREATE TABLE IF NOT EXISTS `chi_tiet_don_hang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `don_hang_id` int NOT NULL,
  `san_pham_id` int NOT NULL,
  `so_luong` int NOT NULL,
  `don_gia` decimal(15,2) NOT NULL,
  `thanh_tien` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `don_hang_id` (`don_hang_id`),
  KEY `san_pham_id` (`san_pham_id`),
  CONSTRAINT `ctdh_ibfk_1` FOREIGN KEY (`don_hang_id`) REFERENCES `don_hang` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ctdh_ibfk_2` FOREIGN KEY (`san_pham_id`) REFERENCES `san_pham` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table ban_hang.chi_tiet_don_hang: ~2 rows (approximately)
INSERT INTO `chi_tiet_don_hang` (`id`, `don_hang_id`, `san_pham_id`, `so_luong`, `don_gia`, `thanh_tien`) VALUES
	(1, 1, 14, 1, 25000.00, 25000.00),
	(2, 1, 13, 1, 12000.00, 12000.00),
	(3, 1, 12, 2, 5000.00, 10000.00);

-- Dumping structure for table ban_hang.chi_tiet_hoa_don
CREATE TABLE IF NOT EXISTS `chi_tiet_hoa_don` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hoa_don_id` int NOT NULL,
  `san_pham_id` int NOT NULL,
  `so_luong` int NOT NULL,
  `don_gia` decimal(15,2) NOT NULL,
  `thanh_tien` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `hoa_don_id` (`hoa_don_id`),
  KEY `san_pham_id` (`san_pham_id`),
  CONSTRAINT `chi_tiet_hoa_don_ibfk_1` FOREIGN KEY (`hoa_don_id`) REFERENCES `hoa_don` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chi_tiet_hoa_don_ibfk_2` FOREIGN KEY (`san_pham_id`) REFERENCES `san_pham` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table ban_hang.chi_tiet_hoa_don: ~12 rows (approximately)
INSERT INTO `chi_tiet_hoa_don` (`id`, `hoa_don_id`, `san_pham_id`, `so_luong`, `don_gia`, `thanh_tien`) VALUES
	(1, 1, 4, 1, 150000.00, 150000.00),
	(2, 1, 5, 0, 50000.00, 50000.00),
	(3, 2, 1, 1, 8990000.00, 8990000.00),
	(4, 2, 2, 1, 1200000.00, 1200000.00),
	(5, 3, 12, 5, 5000.00, 25000.00),
	(6, 3, 9, 6, 25000.00, 150000.00),
	(7, 4, 10, 1, 500000.00, 500000.00),
	(8, 5, 8, 5, 8000.00, 40000.00),
	(9, 5, 12, 1, 5000.00, 5000.00),
	(10, 6, 14, 1, 25000.00, 25000.00),
	(11, 6, 13, 1, 12000.00, 12000.00),
	(12, 6, 12, 2, 5000.00, 10000.00);

-- Dumping structure for table ban_hang.chi_tiet_nhap_kho
CREATE TABLE IF NOT EXISTS `chi_tiet_nhap_kho` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phieu_nhap_id` int NOT NULL,
  `san_pham_id` int NOT NULL,
  `so_luong` int NOT NULL,
  `don_gia_nhap` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `phieu_nhap_id` (`phieu_nhap_id`),
  KEY `san_pham_id` (`san_pham_id`),
  CONSTRAINT `chi_tiet_nhap_kho_ibfk_1` FOREIGN KEY (`phieu_nhap_id`) REFERENCES `phieu_nhap_kho` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chi_tiet_nhap_kho_ibfk_2` FOREIGN KEY (`san_pham_id`) REFERENCES `san_pham` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table ban_hang.chi_tiet_nhap_kho: ~7 rows (approximately)
INSERT INTO `chi_tiet_nhap_kho` (`id`, `phieu_nhap_id`, `san_pham_id`, `so_luong`, `don_gia_nhap`) VALUES
	(1, 1, 1, 20, 7500000.00),
	(2, 1, 2, 50, 950000.00),
	(3, 1, 3, 100, 50000.00),
	(4, 2, 7, 60, 150000.00),
	(5, 3, 4, 100, 80000.00),
	(6, 3, 5, 50, 200000.00),
	(7, 3, 6, 30, 300000.00);

-- Dumping structure for table ban_hang.chi_tiet_tra_hang
CREATE TABLE IF NOT EXISTS `chi_tiet_tra_hang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tra_hang_id` int NOT NULL,
  `chi_tiet_hoa_don_id` int NOT NULL,
  `so_luong_tra` int NOT NULL,
  `ly_do` text,
  PRIMARY KEY (`id`),
  KEY `tra_hang_id` (`tra_hang_id`),
  KEY `chi_tiet_hoa_don_id` (`chi_tiet_hoa_don_id`),
  CONSTRAINT `chi_tiet_tra_hang_ibfk_1` FOREIGN KEY (`tra_hang_id`) REFERENCES `tra_hang` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chi_tiet_tra_hang_ibfk_2` FOREIGN KEY (`chi_tiet_hoa_don_id`) REFERENCES `chi_tiet_hoa_don` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table ban_hang.chi_tiet_tra_hang: ~0 rows (approximately)

-- Dumping structure for table ban_hang.danh_muc
CREATE TABLE IF NOT EXISTS `danh_muc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_danh_muc` varchar(100) NOT NULL,
  `mo_ta` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ten_danh_muc` (`ten_danh_muc`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table ban_hang.danh_muc: ~5 rows (approximately)
INSERT INTO `danh_muc` (`id`, `ten_danh_muc`, `mo_ta`) VALUES
	(1, 'Điện tử', 'Điện thoại, máy tính, phụ kiện'),
	(2, 'Thời trang', 'Quần áo, giày dép, túi xách'),
	(3, 'Thực phẩm', 'Đồ ăn, thức uống, bánh kẹo'),
	(4, 'Gia dụng', 'Đồ dùng nhà bếp, vệ sinh'),
	(5, 'Văn phòng phẩm', 'Bút, vở, dụng cụ học tập');

-- Dumping structure for table ban_hang.don_hang
CREATE TABLE IF NOT EXISTS `don_hang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `so_dh` varchar(50) NOT NULL,
  `khach_hang_id` int DEFAULT NULL,
  `nhan_vien_id` int DEFAULT NULL,
  `ngay_dat` datetime DEFAULT CURRENT_TIMESTAMP,
  `tong_tien` decimal(15,2) NOT NULL DEFAULT '0.00',
  `giam_gia` decimal(15,2) NOT NULL DEFAULT '0.00',
  `thanh_tien` decimal(15,2) NOT NULL DEFAULT '0.00',
  `trang_thai` enum('pending','paid','cancelled') DEFAULT 'pending',
  `ghi_chu` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `so_dh` (`so_dh`),
  KEY `khach_hang_id` (`khach_hang_id`),
  KEY `nhan_vien_id` (`nhan_vien_id`),
  CONSTRAINT `don_hang_ibfk_1` FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang` (`id`) ON DELETE SET NULL,
  CONSTRAINT `don_hang_ibfk_2` FOREIGN KEY (`nhan_vien_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table ban_hang.don_hang: ~0 rows (approximately)
INSERT INTO `don_hang` (`id`, `so_dh`, `khach_hang_id`, `nhan_vien_id`, `ngay_dat`, `tong_tien`, `giam_gia`, `thanh_tien`, `trang_thai`, `ghi_chu`) VALUES
	(1, 'DH20260618072601278', NULL, 1, '2026-06-18 14:26:01', 47000.00, 10000.00, 37000.00, 'paid', NULL);

-- Dumping structure for table ban_hang.hoa_don
CREATE TABLE IF NOT EXISTS `hoa_don` (
  `id` int NOT NULL AUTO_INCREMENT,
  `don_hang_id` int DEFAULT NULL,
  `so_hd` varchar(50) NOT NULL,
  `khach_hang_id` int DEFAULT NULL,
  `nhan_vien_id` int DEFAULT NULL,
  `ngay_lap` datetime DEFAULT CURRENT_TIMESTAMP,
  `phuong_thuc_tt` enum('Tiền mặt','Chuyển khoản','QR Code','Thẻ') DEFAULT 'Tiền mặt',
  `tong_tien` decimal(15,2) NOT NULL DEFAULT '0.00',
  `giam_gia` decimal(15,2) NOT NULL DEFAULT '0.00',
  `thanh_tien` decimal(15,2) NOT NULL DEFAULT '0.00',
  `trang_thai` enum('pending','completed','cancelled') DEFAULT 'completed',
  `ghi_chu` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `so_hd` (`so_hd`),
  KEY `khach_hang_id` (`khach_hang_id`),
  KEY `nhan_vien_id` (`nhan_vien_id`),
  KEY `don_hang_id` (`don_hang_id`),
  CONSTRAINT `hoa_don_don_hang_fk` FOREIGN KEY (`don_hang_id`) REFERENCES `don_hang` (`id`) ON DELETE SET NULL,
  CONSTRAINT `hoa_don_ibfk_1` FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang` (`id`) ON DELETE SET NULL,
  CONSTRAINT `hoa_don_ibfk_2` FOREIGN KEY (`nhan_vien_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table ban_hang.hoa_don: ~5 rows (approximately)
INSERT INTO `hoa_don` (`id`, `don_hang_id`, `so_hd`, `khach_hang_id`, `nhan_vien_id`, `ngay_lap`, `phuong_thuc_tt`, `tong_tien`, `giam_gia`, `thanh_tien`, `trang_thai`, `ghi_chu`) VALUES
	(1, NULL, 'HD20241001001', 1, 3, '2026-06-14 12:58:01', 'Tiền mặt', 200000.00, 0.00, 200000.00, 'completed', NULL),
	(2, NULL, 'HD20241001002', 2, 3, '2026-06-14 12:58:01', 'QR Code', 9340000.00, 100000.00, 9240000.00, 'completed', NULL),
	(3, NULL, 'HD20241002001', 3, 3, '2026-06-14 12:58:01', 'Chuyển khoản', 175000.00, 0.00, 175000.00, 'completed', NULL),
	(4, NULL, 'HD20241002002', 1, 3, '2026-06-14 12:58:01', 'Tiền mặt', 500000.00, 50000.00, 450000.00, 'completed', NULL),
	(5, NULL, 'HD20241003001', NULL, 3, '2026-06-14 12:58:01', 'Tiền mặt', 45000.00, 0.00, 45000.00, 'completed', NULL),
	(6, 1, 'HD20260618072612498', NULL, 1, '2026-06-18 14:26:12', 'Thẻ', 47000.00, 10000.00, 37000.00, 'completed', NULL);

-- Dumping structure for table ban_hang.khach_hang
CREATE TABLE IF NOT EXISTS `khach_hang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_kh` varchar(50) NOT NULL,
  `ho_ten` varchar(100) NOT NULL,
  `so_dien_thoai` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `gioi_tinh` enum('Nam','Nữ','Khác') DEFAULT NULL,
  `dia_chi` text,
  `ngay_dang_ky` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `diem_tich_luy` int NOT NULL DEFAULT '0',
  `hang_thanh_vien` enum('Bạc','Vàng','Kim cương') DEFAULT 'Bạc',
  `ghi_chu` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_kh` (`ma_kh`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table ban_hang.khach_hang: ~6 rows (approximately)
INSERT INTO `khach_hang` (`id`, `ma_kh`, `ho_ten`, `so_dien_thoai`, `email`, `ngay_sinh`, `gioi_tinh`, `dia_chi`, `ngay_dang_ky`, `diem_tich_luy`, `hang_thanh_vien`, `ghi_chu`) VALUES
	(1, 'KH00001', 'Nguyễn Thị Lan', '0901234567', 'lan.nguyen@gmail.com', '1990-05-15', 'Nữ', NULL, '2026-06-14 05:58:01', 1500, 'Vàng', NULL),
	(2, 'KH00002', 'Trần Văn Bình', '0912345678', 'binh.tran@gmail.com', '1985-08-20', 'Nam', NULL, '2026-06-14 05:58:01', 5500, 'Kim cương', NULL),
	(3, 'KH00003', 'Lê Thị Cúc', '0923456789', 'cuc.le@gmail.com', '1995-11-10', 'Nữ', NULL, '2026-06-14 05:58:01', 300, 'Bạc', NULL),
	(4, 'KH00004', 'Phạm Quốc Dũng', '0934567890', 'dung.pham@gmail.com', '1988-03-25', 'Nam', NULL, '2026-06-14 05:58:01', 800, 'Bạc', NULL),
	(5, 'KH00005', 'Hoàng Thị Em', '0945678901', 'em.hoang@gmail.com', '2000-07-04', 'Nữ', NULL, '2026-06-14 05:58:01', 100, 'Bạc', NULL),
	(6, 'KH00006', 'q', '1', 'q@gmail.com', '2026-06-03', 'Nữ', '1', '2026-06-15 06:44:33', 0, 'Bạc', NULL);

-- Dumping structure for table ban_hang.khuyen_mai
CREATE TABLE IF NOT EXISTS `khuyen_mai` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_km` varchar(200) NOT NULL,
  `mo_ta` text,
  `loai_km` enum('percent','fixed') NOT NULL,
  `gia_tri` decimal(10,2) NOT NULL DEFAULT '0.00',
  `ngay_bat_dau` date NOT NULL,
  `ngay_ket_thuc` date NOT NULL,
  `trang_thai` tinyint(1) NOT NULL DEFAULT '1',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table ban_hang.khuyen_mai: ~4 rows (approximately)
INSERT INTO `khuyen_mai` (`id`, `ten_km`, `mo_ta`, `loai_km`, `gia_tri`, `ngay_bat_dau`, `ngay_ket_thuc`, `trang_thai`, `ngay_tao`) VALUES
	(1, 'Giảm 10% tất cả sản phẩm', 'Áp dụng toàn bộ đơn hàng', 'percent', 10.00, '2024-10-01', '2024-10-31', 1, '2026-06-14 05:58:01'),
	(2, 'Giảm 50,000đ đơn từ 500k', 'Đơn hàng trên 500,000đ', 'fixed', 50000.00, '2024-10-15', '2024-11-15', 1, '2026-06-14 05:58:01'),
	(3, 'Flash sale điện tử 20%', 'Chỉ áp dụng danh mục điện tử', 'percent', 20.00, '2024-09-01', '2024-09-30', 1, '2026-06-14 05:58:01'),
	(4, '1', '1', 'percent', 11.00, '2026-06-15', '2026-07-04', 1, '2026-06-15 06:43:48'),
	(6, '2', '2', 'percent', 2.00, '2026-06-18', '2026-07-10', 1, '2026-06-18 07:20:33');

-- Dumping structure for table ban_hang.phieu_nhap_kho
CREATE TABLE IF NOT EXISTS `phieu_nhap_kho` (
  `id` int NOT NULL AUTO_INCREMENT,
  `so_pn` varchar(50) NOT NULL,
  `nha_cung_cap` varchar(200) DEFAULT NULL,
  `nhan_vien_id` int DEFAULT NULL,
  `ngay_nhap` datetime DEFAULT CURRENT_TIMESTAMP,
  `ghi_chu` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `so_pn` (`so_pn`),
  KEY `nhan_vien_id` (`nhan_vien_id`),
  CONSTRAINT `phieu_nhap_kho_ibfk_1` FOREIGN KEY (`nhan_vien_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table ban_hang.phieu_nhap_kho: ~3 rows (approximately)
INSERT INTO `phieu_nhap_kho` (`id`, `so_pn`, `nha_cung_cap`, `nhan_vien_id`, `ngay_nhap`, `ghi_chu`) VALUES
	(1, 'PN20241001001', 'Công ty TNHH Samsung VN', 4, '2026-06-14 12:58:01', 'Nhập hàng tháng 10'),
	(2, 'PN20241005001', 'Nhà phân phối Highlands', 4, '2026-06-14 12:58:01', 'Bổ sung cà phê'),
	(3, 'PN20241010001', 'Xưởng may Bình Dương', 4, '2026-06-14 12:58:01', 'Nhập thời trang mùa đông');

-- Dumping structure for table ban_hang.san_pham
CREATE TABLE IF NOT EXISTS `san_pham` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_sp` varchar(50) NOT NULL,
  `ten_sp` varchar(200) NOT NULL,
  `danh_muc_id` int DEFAULT NULL,
  `don_vi_tinh` varchar(50) DEFAULT 'cái',
  `gia_ban` decimal(15,2) NOT NULL DEFAULT '0.00',
  `so_luong_ton` int NOT NULL DEFAULT '0',
  `mo_ta` text,
  `hinh_anh` varchar(255) DEFAULT NULL,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_sp` (`ma_sp`),
  KEY `danh_muc_id` (`danh_muc_id`),
  CONSTRAINT `san_pham_ibfk_1` FOREIGN KEY (`danh_muc_id`) REFERENCES `danh_muc` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table ban_hang.san_pham: ~15 rows (approximately)
INSERT INTO `san_pham` (`id`, `ma_sp`, `ten_sp`, `danh_muc_id`, `don_vi_tinh`, `gia_ban`, `so_luong_ton`, `mo_ta`, `hinh_anh`, `ngay_tao`) VALUES
	(1, 'SP001', 'San pham da sua', 1, 'Cái', 310000.00, 50, 'Mo ta moi', NULL, '2026-06-14 05:58:01'),
	(2, 'SP002', 'Tai nghe JBL T450', 1, 'Cái', 1200000.00, 100, NULL, NULL, '2026-06-14 05:58:01'),
	(3, 'SP003', 'Cáp sạc Type-C 1m', 1, 'Cái', 95000.00, 200, NULL, NULL, '2026-06-14 05:58:01'),
	(4, 'SP004', 'Áo thun nam basic', 2, 'Cái', 150000.00, 150, NULL, NULL, '2026-06-14 05:58:01'),
	(5, 'SP005', 'Quần jeans nữ', 2, 'Cái', 350000.00, 80, NULL, NULL, '2026-06-14 05:58:01'),
	(6, 'SP006', 'Giày sneaker', 2, 'Đôi', 520000.00, 60, NULL, NULL, '2026-06-14 05:58:01'),
	(7, 'SP007', 'Cà phê Highlands 500g', 3, 'Gói', 189000.00, 120, NULL, NULL, '2026-06-14 05:58:01'),
	(8, 'SP008', 'Nước suối Lavie 500ml', 3, 'Chai', 8000.00, 1000, NULL, NULL, '2026-06-14 05:58:01'),
	(9, 'SP009', 'Bánh mì sandwich', 3, 'Ổ', 25000.00, 50, NULL, NULL, '2026-06-14 05:58:01'),
	(10, 'SP010', 'Nồi cơm điện Sunhouse 1.2L', 4, 'Cái', 850000.00, 30, NULL, NULL, '2026-06-14 05:58:01'),
	(11, 'SP011', 'Chổi quét nhà', 4, 'Cái', 45000.00, 80, NULL, NULL, '2026-06-14 05:58:01'),
	(12, 'SP012', 'Bút bi Thiên Long', 5, 'Cây', 5000.00, 498, NULL, NULL, '2026-06-14 05:58:01'),
	(13, 'SP013', 'Vở kẻ ngang 96 trang', 5, 'Quyển', 12000.00, 299, NULL, NULL, '2026-06-14 05:58:01'),
	(14, 'SP1781761590', 'San pham test', 1, 'cai', 25000.00, 99, 'Mo ta', NULL, '2026-06-18 05:46:30'),
	(16, 'SP1781769366', 'San pham test', 1, 'cai', 36000.00, 100, 'Mo ta san pham', NULL, '2026-06-18 07:56:06');

-- Dumping structure for table ban_hang.tra_hang
CREATE TABLE IF NOT EXISTS `tra_hang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hoa_don_id` int NOT NULL,
  `ngay_tra` datetime DEFAULT CURRENT_TIMESTAMP,
  `ly_do` text,
  `so_tien_hoan` decimal(15,2) NOT NULL DEFAULT '0.00',
  `phuong_thuc_hoan` varchar(100) DEFAULT NULL,
  `trang_thai` enum('pending','approved','rejected','completed') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `hoa_don_id` (`hoa_don_id`),
  CONSTRAINT `tra_hang_ibfk_1` FOREIGN KEY (`hoa_don_id`) REFERENCES `hoa_don` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table ban_hang.tra_hang: ~0 rows (approximately)

-- Dumping structure for table ban_hang.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ho_ten` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mat_khau` varchar(255) NOT NULL,
  `vai_tro` enum('admin','manager','cashier','stock_keeper') DEFAULT 'cashier',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table ban_hang.users: ~5 rows (approximately)
INSERT INTO `users` (`id`, `ho_ten`, `email`, `mat_khau`, `vai_tro`, `ngay_tao`) VALUES
	(1, 'Quản trị viên', 'admin@hkt.com', '$2y$10$mDkR8Ezx5Sm0ANXYd.vO5.8fGibbjXMV/xU8XW9I6k6Rzb3jXbvO.', 'admin', '2026-06-14 05:58:01'),
	(2, 'Nguyễn Văn A', 'manager@hkt.com', '$2y$10$mDkR8Ezx5Sm0ANXYd.vO5.8fGibbjXMV/xU8XW9I6k6Rzb3jXbvO.', 'manager', '2026-06-14 05:58:01'),
	(3, 'Trần Thị B', 'thu_ngan@hkt.com', '$2y$10$mDkR8Ezx5Sm0ANXYd.vO5.8fGibbjXMV/xU8XW9I6k6Rzb3jXbvO.', 'cashier', '2026-06-14 05:58:01'),
	(4, 'Lê Văn C', 'kho@hkt.com', '$2y$10$mDkR8Ezx5Sm0ANXYd.vO5.8fGibbjXMV/xU8XW9I6k6Rzb3jXbvO.', 'stock_keeper', '2026-06-14 05:58:01'),
	(6, 'Nguyen Van X', 'nvx@hkt.com', '$2y$10$fRsMDHx2z8reqoamq7xgtetEEAld3SaH9TJZcWr7WfKMgkSi7tJmi', 'cashier', '2026-06-23 07:02:22');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

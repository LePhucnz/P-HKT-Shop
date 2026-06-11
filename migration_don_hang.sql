-- ============================================================
-- Migration: them thuc the DON HANG (Sản phẩm -> Đơn hàng -> Hóa đơn)
-- Chay file nay SAU khi da import sql.sql
-- ============================================================

USE `ban_hang`;

-- 1) Bang don hang (yeu cau mua, truoc thanh toan)
CREATE TABLE IF NOT EXISTS `don_hang` (
  `id`            INT NOT NULL AUTO_INCREMENT,
  `so_dh`         VARCHAR(50) NOT NULL,
  `khach_hang_id` INT DEFAULT NULL,
  `nhan_vien_id`  INT DEFAULT NULL,
  `ngay_dat`      DATETIME DEFAULT CURRENT_TIMESTAMP,
  `tong_tien`     DECIMAL(15,2) NOT NULL DEFAULT '0.00',
  `giam_gia`      DECIMAL(15,2) NOT NULL DEFAULT '0.00',
  `thanh_tien`    DECIMAL(15,2) NOT NULL DEFAULT '0.00',
  -- pending: cho thanh toan | paid: da tao hoa don | cancelled: da huy
  `trang_thai`    ENUM('pending','paid','cancelled') DEFAULT 'pending',
  `ghi_chu`       TEXT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `so_dh` (`so_dh`),
  KEY `khach_hang_id` (`khach_hang_id`),
  KEY `nhan_vien_id` (`nhan_vien_id`),
  CONSTRAINT `don_hang_ibfk_1` FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang` (`id`) ON DELETE SET NULL,
  CONSTRAINT `don_hang_ibfk_2` FOREIGN KEY (`nhan_vien_id`)  REFERENCES `users` (`id`)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2) Chi tiet don hang
CREATE TABLE IF NOT EXISTS `chi_tiet_don_hang` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `don_hang_id` INT NOT NULL,
  `san_pham_id` INT NOT NULL,
  `so_luong`    INT NOT NULL,
  `don_gia`     DECIMAL(15,2) NOT NULL,
  `thanh_tien`  DECIMAL(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `don_hang_id` (`don_hang_id`),
  KEY `san_pham_id` (`san_pham_id`),
  CONSTRAINT `ctdh_ibfk_1` FOREIGN KEY (`don_hang_id`) REFERENCES `don_hang` (`id`)  ON DELETE CASCADE,
  CONSTRAINT `ctdh_ibfk_2` FOREIGN KEY (`san_pham_id`) REFERENCES `san_pham` (`id`)  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3) Lien ket hoa don -> don hang (mot don hang sinh ra mot hoa don)
ALTER TABLE `hoa_don`
  ADD COLUMN `don_hang_id` INT DEFAULT NULL AFTER `id`,
  ADD KEY `don_hang_id` (`don_hang_id`),
  ADD CONSTRAINT `hoa_don_don_hang_fk` FOREIGN KEY (`don_hang_id`) REFERENCES `don_hang` (`id`) ON DELETE SET NULL;

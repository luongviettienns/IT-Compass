ALTER TABLE `bai_viet_blog`
  MODIFY COLUMN `trang_thai` ENUM('nhap', 'len_lich', 'xuat_ban') NOT NULL DEFAULT 'xuat_ban',
  ADD COLUMN `meta_tieu_de` VARCHAR(220) NULL AFTER `noi_bat`,
  ADD COLUMN `meta_mo_ta` VARCHAR(320) NULL AFTER `meta_tieu_de`,
  ADD COLUMN `canonical_url` VARCHAR(500) NULL AFTER `meta_mo_ta`,
  ADD COLUMN `og_image_url` VARCHAR(500) NULL AFTER `canonical_url`,
  ADD COLUMN `khong_lap_chi_muc` TINYINT(1) NOT NULL DEFAULT 0 AFTER `og_image_url`,
  ADD COLUMN `tu_khoa_seo` VARCHAR(500) NULL AFTER `khong_lap_chi_muc`,
  ADD COLUMN `len_lich_luc` DATETIME NULL AFTER `xuat_ban_luc`,
  ADD COLUMN `xuat_ban_boi` BIGINT UNSIGNED NULL AFTER `len_lich_luc`,
  ADD COLUMN `xoa_luc` DATETIME NULL AFTER `xuat_ban_boi`,
  ADD COLUMN `xoa_boi` BIGINT UNSIGNED NULL AFTER `xoa_luc`;

CREATE INDEX `idx_bv_len_lich_luc` ON `bai_viet_blog` (`len_lich_luc`);
CREATE INDEX `idx_bv_xoa_luc` ON `bai_viet_blog` (`xoa_luc`);

CREATE TABLE `binh_luan_bai_viet` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `bai_viet_id` BIGINT UNSIGNED NOT NULL,
  `nguoi_dung_id` BIGINT UNSIGNED NULL,
  `ten_khach` VARCHAR(120) NULL,
  `noi_dung` TEXT NOT NULL,
  `trang_thai` ENUM('hien', 'an') NOT NULL DEFAULT 'hien',
  `xoa_luc` DATETIME NULL,
  `xoa_boi` BIGINT UNSIGNED NULL,
  `tao_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cap_nhat_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_blbv_bai_viet_trang_thai` (`bai_viet_id`, `trang_thai`),
  KEY `idx_blbv_xoa_luc` (`xoa_luc`),
  CONSTRAINT `fk_blbv_bv`
    FOREIGN KEY (`bai_viet_id`) REFERENCES `bai_viet_blog`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_blbv_nd`
    FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

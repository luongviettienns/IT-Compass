CREATE TABLE `bai_viet_blog` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tac_gia_id` BIGINT UNSIGNED NOT NULL,
  `tieu_de` VARCHAR(220) NOT NULL,
  `slug` VARCHAR(240) NOT NULL,
  `tom_tat` VARCHAR(500) NULL,
  `noi_dung` TEXT NOT NULL,
  `the_loai` VARCHAR(100) NULL,
  `anh_bia_url` VARCHAR(500) NULL,
  `thoi_gian_doc` VARCHAR(50) NULL,
  `trang_thai` ENUM('nhap', 'xuat_ban') NOT NULL DEFAULT 'xuat_ban',
  `noi_bat` TINYINT(1) NOT NULL DEFAULT 0,
  `luot_xem` INT UNSIGNED NOT NULL DEFAULT 0,
  `luot_thich` INT UNSIGNED NOT NULL DEFAULT 0,
  `xuat_ban_luc` DATETIME NULL,
  `tao_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cap_nhat_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_bv_tac_gia_id` (`tac_gia_id`),
  KEY `idx_bv_trang_thai_xuat_ban` (`trang_thai`, `xuat_ban_luc`),
  CONSTRAINT `fk_bv_tac_gia`
    FOREIGN KEY (`tac_gia_id`) REFERENCES `nguoi_dung`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

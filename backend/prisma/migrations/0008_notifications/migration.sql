CREATE TABLE `thong_bao` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nguoi_dung_id` BIGINT UNSIGNED NOT NULL,
  `loai` ENUM('dat_lich_moi', 'dat_lich_da_xac_nhan', 'dat_lich_hoc_vien_huy', 'dat_lich_mentor_huy', 'dat_lich_hoan_thanh', 'dat_lich_khong_tham_du', 'nhac_lich_tu_van') NOT NULL,
  `tieu_de` VARCHAR(220) NOT NULL,
  `noi_dung` VARCHAR(1000) NOT NULL,
  `du_lieu_json` JSON NOT NULL,
  `dedupe_key` VARCHAR(191) NULL,
  `da_doc_luc` DATETIME NULL,
  `tao_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cap_nhat_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_thong_bao_dedupe_key` (`dedupe_key`),
  KEY `idx_thongbao_nguoi_dung_trang_thai_thoi_gian` (`nguoi_dung_id`, `da_doc_luc`, `tao_luc`),
  KEY `idx_thongbao_tao_luc` (`tao_luc`),
  CONSTRAINT `fk_thongbao_nguoi_dung`
    FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

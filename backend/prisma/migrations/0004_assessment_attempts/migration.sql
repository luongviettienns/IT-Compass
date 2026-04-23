CREATE TABLE `ket_qua_danh_gia` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nguoi_dung_id` BIGINT UNSIGNED NOT NULL,
  `loai_bai` ENUM('it_compass_v1') NOT NULL DEFAULT 'it_compass_v1',
  `phien_ban_bai` VARCHAR(40) NOT NULL,
  `trang_thai` ENUM('da_nop') NOT NULL DEFAULT 'da_nop',
  `ma_ket_qua` VARCHAR(50) NOT NULL,
  `nhom_noi_bat` JSON NOT NULL,
  `diem_tho_json` JSON NOT NULL,
  `cau_tra_loi_json` JSON NOT NULL,
  `tom_tat_json` JSON NOT NULL,
  `bat_dau_luc` DATETIME NULL,
  `nop_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tao_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cap_nhat_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kqdt_nguoi_dung_nop_luc` (`nguoi_dung_id`, `nop_luc`),
  KEY `idx_kqdt_nguoi_dung_loai_bai` (`nguoi_dung_id`, `loai_bai`),
  KEY `idx_kqdt_ma_ket_qua` (`ma_ket_qua`),
  CONSTRAINT `fk_kqdt_nd`
    FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

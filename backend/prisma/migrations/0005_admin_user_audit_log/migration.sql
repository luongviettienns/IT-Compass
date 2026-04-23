CREATE TABLE `nhat_ky_quan_tri_nguoi_dung` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nguoi_thuc_hien_id` BIGINT UNSIGNED NOT NULL,
  `nguoi_bi_tac_dong_id` BIGINT UNSIGNED NOT NULL,
  `hanh_dong` ENUM(
    'cap_nhat_tai_khoan',
    'cap_nhat_ho_so',
    'cap_nhat_trang_thai',
    'cap_nhat_vai_tro',
    'thu_hoi_phien',
    'cap_nhat_trang_thai_hang_loat',
    'thu_hoi_phien_hang_loat'
  ) NOT NULL,
  `ly_do` VARCHAR(500) NULL,
  `truoc_json` JSON NULL,
  `sau_json` JSON NULL,
  `tao_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nkqtnd_nguoi_thuc_hien_tao_luc` (`nguoi_thuc_hien_id`, `tao_luc`),
  KEY `idx_nkqtnd_nguoi_bi_tac_dong_tao_luc` (`nguoi_bi_tac_dong_id`, `tao_luc`),
  KEY `idx_nkqtnd_hanh_dong_tao_luc` (`hanh_dong`, `tao_luc`),
  CONSTRAINT `fk_nkqtnd_nguoi_thuc_hien`
    FOREIGN KEY (`nguoi_thuc_hien_id`) REFERENCES `nguoi_dung`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_nkqtnd_nguoi_bi_tac_dong`
    FOREIGN KEY (`nguoi_bi_tac_dong_id`) REFERENCES `nguoi_dung`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

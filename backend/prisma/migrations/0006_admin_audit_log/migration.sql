CREATE TABLE `nhat_ky_quan_tri` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nguoi_thuc_hien_id` BIGINT UNSIGNED NOT NULL,
  `hanh_dong` ENUM(
    'tao_bai_viet',
    'cap_nhat_bai_viet',
    'cap_nhat_trang_thai_bai_viet',
    'xuat_ban_bai_viet',
    'len_lich_bai_viet',
    'xoa_bai_viet',
    'khoi_phuc_bai_viet',
    'kiem_duyet_binh_luan',
    'xoa_binh_luan'
  ) NOT NULL,
  `loai_doi_tuong` VARCHAR(50) NOT NULL,
  `doi_tuong_id` VARCHAR(191) NULL,
  `ly_do` VARCHAR(500) NULL,
  `du_lieu_json` JSON NULL,
  `tao_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nkqt_nguoi_thuc_hien_tao_luc` (`nguoi_thuc_hien_id`, `tao_luc`),
  KEY `idx_nkqt_hanh_dong_tao_luc` (`hanh_dong`, `tao_luc`),
  KEY `idx_nkqt_loai_doi_tuong_id` (`loai_doi_tuong`, `doi_tuong_id`),
  CONSTRAINT `fk_nkqt_nguoi_thuc_hien`
    FOREIGN KEY (`nguoi_thuc_hien_id`) REFERENCES `nguoi_dung`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

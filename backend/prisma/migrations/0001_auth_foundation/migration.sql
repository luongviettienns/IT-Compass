CREATE TABLE `phien_dang_nhap` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nguoi_dung_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `user_agent` VARCHAR(500) NULL,
  `ip` VARCHAR(45) NULL,
  `het_han_luc` DATETIME NOT NULL,
  `thu_hoi_luc` DATETIME NULL,
  `tao_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cap_nhat_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pdn_token_hash` (`token_hash`),
  KEY `idx_pdn_nguoi_dung_id` (`nguoi_dung_id`),
  KEY `idx_pdn_het_han_luc` (`het_han_luc`),
  CONSTRAINT `fk_pdn_nd`
    FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `token_xac_thuc_email` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nguoi_dung_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `het_han_luc` DATETIME NOT NULL,
  `da_dung_luc` DATETIME NULL,
  `tao_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cap_nhat_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_txt_email_token_hash` (`token_hash`),
  KEY `idx_txt_email_nguoi_dung_id` (`nguoi_dung_id`),
  KEY `idx_txt_email_het_han_luc` (`het_han_luc`),
  CONSTRAINT `fk_txt_email_nd`
    FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `token_dat_lai_mat_khau` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nguoi_dung_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `het_han_luc` DATETIME NOT NULL,
  `da_dung_luc` DATETIME NULL,
  `tao_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cap_nhat_luc` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token_dlmk_hash` (`token_hash`),
  KEY `idx_token_dlmk_nguoi_dung_id` (`nguoi_dung_id`),
  KEY `idx_token_dlmk_het_han_luc` (`het_han_luc`),
  CONSTRAINT `fk_token_dlmk_nd`
    FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

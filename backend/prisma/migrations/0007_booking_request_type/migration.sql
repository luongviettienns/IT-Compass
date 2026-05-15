ALTER TABLE `dat_lich_mentor`
  ADD COLUMN `loai_yeu_cau` ENUM('khung_gio_co_san', 'gio_de_xuat') NOT NULL DEFAULT 'khung_gio_co_san' AFTER `trang_thai`;

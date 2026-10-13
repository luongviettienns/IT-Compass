ALTER TABLE `dat_lich_mentor`
  ADD COLUMN `request_key_hash` CHAR(64) NULL,
  ADD COLUMN `request_payload_hash` CHAR(64) NULL,
  ADD UNIQUE INDEX `uq_datlich_hocvien_request_key` (`hoc_vien_id`, `request_key_hash`);

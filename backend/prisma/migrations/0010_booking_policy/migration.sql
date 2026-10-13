ALTER TABLE `dat_lich_mentor`
  ADD COLUMN `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  ADD COLUMN `response_due_at` DATETIME(0) NULL,
  ADD COLUMN `expired_at` DATETIME(0) NULL,
  ADD INDEX `idx_datlich_response_deadline` (`trang_thai`, `expired_at`, `response_due_at`);

-- Preserve existing instants, statuses and attendance history. Legacy pending
-- requests receive the same response window as new manual requests.
UPDATE `dat_lich_mentor`
SET `response_due_at` = LEAST(`bat_dau_luc`, DATE_ADD(`tao_luc`, INTERVAL 24 HOUR))
WHERE `trang_thai` = 'cho_xac_nhan';

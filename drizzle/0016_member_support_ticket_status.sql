ALTER TABLE `support_tickets` ADD COLUMN `contactNameEncrypted` text NULL;
ALTER TABLE `support_tickets` ADD COLUMN `inquiryType` enum('payment_refund','analysis_result','pdf_email','coaching_booking','other') NOT NULL DEFAULT 'other';
ALTER TABLE `support_tickets` ADD COLUMN `respondedAt` timestamp NULL;
ALTER TABLE `support_tickets` ADD COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE `support_tickets` MODIFY COLUMN `status` enum('open','closed','received','reviewing','answered') NOT NULL DEFAULT 'received';
UPDATE `support_tickets` SET `status` = 'received' WHERE `status` = 'open';
UPDATE `support_tickets` SET `status` = 'answered', `respondedAt` = COALESCE(`respondedAt`, `closedAt`) WHERE `status` = 'closed';
ALTER TABLE `support_tickets` MODIFY COLUMN `status` enum('received','reviewing','answered') NOT NULL DEFAULT 'received';

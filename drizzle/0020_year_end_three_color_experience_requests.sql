-- Additive ledger for the 2026 year-end three-color coaching experience event.
-- It intentionally has no order, payment, entitlement, PDF, or email foreign keys.
CREATE TABLE IF NOT EXISTS `year_end_three_color_experience_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `productCode` enum('personal_three_color_experience','engaged_couple_three_color_experience') NOT NULL,
  `preferredDate` varchar(10) NOT NULL,
  `preferredTime` varchar(5) NOT NULL,
  `nameEncrypted` text NOT NULL,
  `contactPhoneEncrypted` text NOT NULL,
  `privacyConsentAcceptedAt` timestamp NOT NULL,
  `privacyConsentVersion` varchar(80) NOT NULL,
  `status` enum('received','reviewing','confirmed','cancelled') NOT NULL DEFAULT 'received',
  `idempotencyKeyHash` varchar(128) NOT NULL,
  `requestFingerprintHash` varchar(128) NOT NULL,
  `confirmedAt` timestamp NULL,
  `cancelledAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `year_end_three_color_experience_requests_id_pk` PRIMARY KEY(`id`),
  CONSTRAINT `year_end_three_color_experience_requests_idempotency_unique` UNIQUE(`idempotencyKeyHash`),
  INDEX `year_end_three_color_experience_requests_status_created_idx` (`status`,`createdAt`),
  INDEX `year_end_three_color_experience_requests_date_status_idx` (`preferredDate`,`status`)
);

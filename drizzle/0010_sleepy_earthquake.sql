CREATE TABLE `account_identities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('manus','email','kakao','naver') NOT NULL,
	`providerSubjectHash` varchar(128) NOT NULL,
	`emailHash` varchar(128),
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `account_identities_id` PRIMARY KEY(`id`),
	CONSTRAINT `account_identities_provider_subject_unique` UNIQUE(`provider`,`providerSubjectHash`)
);
--> statement-breakpoint
CREATE TABLE `account_link_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetEmailHash` varchar(128) NOT NULL,
	`codeHash` varchar(128) NOT NULL,
	`purpose` enum('claim_guest_commerce') NOT NULL,
	`status` enum('pending','verified','expired','cancelled') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `account_link_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analysis_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`customerId` int,
	`entitlementId` int,
	`orderId` int,
	`productId` int NOT NULL,
	`accessMode` enum('member','guest','free') NOT NULL,
	`status` enum('started','completed','expired','deleted') NOT NULL DEFAULT 'started',
	`resultReference` varchar(160),
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`expiresAt` timestamp,
	`deletedAt` timestamp,
	CONSTRAINT `analysis_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`customerId` int NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`status` enum('pending_schedule','scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'pending_schedule',
	`scheduledAt` timestamp,
	`detailsEncrypted` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coaching_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_outbox` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`customerId` int,
	`orderId` int,
	`privateDocumentId` int,
	`purpose` enum('account_link','analysis_result_pdf') NOT NULL,
	`toEmailHash` varchar(128) NOT NULL,
	`toEmailEncrypted` text NOT NULL,
	`status` enum('queued','sending','sent','failed','cancelled') NOT NULL DEFAULT 'queued',
	`providerMessageId` varchar(200),
	`attemptCount` int NOT NULL DEFAULT 0,
	`nextAttemptAt` timestamp NOT NULL,
	`lastErrorCode` varchar(160),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_outbox_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `private_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`customerId` int,
	`orderId` int,
	`analysisRunId` int,
	`documentType` enum('analysis_pdf') NOT NULL,
	`storageKey` varchar(500),
	`status` enum('queued','generated','failed','deleted') NOT NULL DEFAULT 'queued',
	`retentionExpiresAt` timestamp NOT NULL,
	`errorCode` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`generatedAt` timestamp,
	`deletedAt` timestamp,
	CONSTRAINT `private_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `coupon_redemptions` ADD `userId` int;--> statement-breakpoint
ALTER TABLE `entitlements` ADD `userId` int;--> statement-breakpoint
ALTER TABLE `order_items` ADD `regularAmountKrw` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `userId` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `regularAmountKrw` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `product_prices` ADD `regularAmountKrw` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `account_identities_user_idx` ON `account_identities` (`userId`);--> statement-breakpoint
CREATE INDEX `account_identities_email_idx` ON `account_identities` (`emailHash`);--> statement-breakpoint
CREATE INDEX `account_link_challenges_user_status_idx` ON `account_link_challenges` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `account_link_challenges_email_status_idx` ON `account_link_challenges` (`targetEmailHash`,`status`);--> statement-breakpoint
CREATE INDEX `analysis_runs_user_status_idx` ON `analysis_runs` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `analysis_runs_customer_status_idx` ON `analysis_runs` (`customerId`,`status`);--> statement-breakpoint
CREATE INDEX `analysis_runs_entitlement_idx` ON `analysis_runs` (`entitlementId`);--> statement-breakpoint
CREATE INDEX `coaching_bookings_user_status_idx` ON `coaching_bookings` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `coaching_bookings_order_idx` ON `coaching_bookings` (`orderId`);--> statement-breakpoint
CREATE INDEX `email_outbox_status_attempt_idx` ON `email_outbox` (`status`,`nextAttemptAt`);--> statement-breakpoint
CREATE INDEX `email_outbox_user_idx` ON `email_outbox` (`userId`);--> statement-breakpoint
CREATE INDEX `email_outbox_document_idx` ON `email_outbox` (`privateDocumentId`);--> statement-breakpoint
CREATE INDEX `private_documents_user_status_idx` ON `private_documents` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `private_documents_analysis_idx` ON `private_documents` (`analysisRunId`);--> statement-breakpoint
CREATE INDEX `coupon_redemptions_user_state_idx` ON `coupon_redemptions` (`userId`,`state`);--> statement-breakpoint
CREATE INDEX `entitlements_user_product_idx` ON `entitlements` (`userId`,`productId`,`status`);--> statement-breakpoint
CREATE INDEX `orders_user_status_idx` ON `orders` (`userId`,`status`);
--> statement-breakpoint
UPDATE `product_prices`
SET `regularAmountKrw` = `amountKrw`
WHERE `regularAmountKrw` = 0;
--> statement-breakpoint
INSERT INTO `products` (`code`, `name`, `fulfillmentType`, `requiresPayment`, `active`) VALUES
  ('personal_coaching', '1:1 컬러심리 코칭', 'coaching', true, false),
  ('couple_coaching', '커플 관계코칭', 'coaching', true, false)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `fulfillmentType` = VALUES(`fulfillmentType`),
  `requiresPayment` = VALUES(`requiresPayment`),
  `active` = VALUES(`active`);
--> statement-breakpoint
INSERT INTO `product_prices` (`productId`, `regularAmountKrw`, `amountKrw`, `currency`, `version`, `active`)
SELECT `id`,
  CASE `code`
    WHEN 'personal_coaching' THEN 120000
    WHEN 'couple_coaching' THEN 250000
  END,
  CASE `code`
    WHEN 'personal_coaching' THEN 100000
    WHEN 'couple_coaching' THEN 180000
  END,
  'KRW',
  1,
  false
FROM `products`
WHERE `code` IN ('personal_coaching', 'couple_coaching')
ON DUPLICATE KEY UPDATE
  `regularAmountKrw` = VALUES(`regularAmountKrw`),
  `amountKrw` = VALUES(`amountKrw`),
  `active` = VALUES(`active`);

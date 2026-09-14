CREATE TABLE `admin_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminUserId` int,
	`action` varchar(120) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(80) NOT NULL,
	`beforeJson` text,
	`afterJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coupon_product_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`couponId` int NOT NULL,
	`productId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupon_product_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupon_product_rules_unique` UNIQUE(`couponId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `coupon_redemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`couponId` int NOT NULL,
	`orderId` int NOT NULL,
	`customerId` int,
	`state` enum('reserved','consumed','released') NOT NULL DEFAULT 'reserved',
	`reservedAt` timestamp NOT NULL DEFAULT (now()),
	`consumedAt` timestamp,
	`releasedAt` timestamp,
	CONSTRAINT `coupon_redemptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupon_redemptions_order_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`discountType` enum('fixed','percent') NOT NULL,
	`discountValue` int NOT NULL,
	`minOrderAmountKrw` int NOT NULL DEFAULT 0,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp,
	`maxRedemptions` int,
	`maxPerCustomer` int,
	`status` enum('active','paused','expired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`emailEncrypted` text NOT NULL,
	`emailHash` varchar(128) NOT NULL,
	`emailVerifiedAt` timestamp,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_email_hash_unique` UNIQUE(`emailHash`)
);
--> statement-breakpoint
CREATE TABLE `entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int,
	`orderItemId` int,
	`productId` int NOT NULL,
	`status` enum('active','reserved','consumed','revoked','expired') NOT NULL DEFAULT 'active',
	`source` enum('purchase','free','admin','migration') NOT NULL DEFAULT 'purchase',
	`usageLimit` int NOT NULL DEFAULT 1,
	`usedCount` int NOT NULL DEFAULT 0,
	`validUntil` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `entitlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `entitlements_order_item_unique` UNIQUE(`orderItemId`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productCodeSnapshot` varchar(80) NOT NULL,
	`productNameSnapshot` varchar(200) NOT NULL,
	`fulfillmentType` enum('analysis','coaching') NOT NULL,
	`priceVersion` int NOT NULL,
	`listAmountKrw` int NOT NULL,
	`discountAmountKrw` int NOT NULL DEFAULT 0,
	`finalAmountKrw` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(64) NOT NULL,
	`customerId` int,
	`guestEmailHash` varchar(128),
	`status` enum('pending','processing','paid','failed','cancelled','expired','refunded') NOT NULL DEFAULT 'pending',
	`currency` varchar(3) NOT NULL DEFAULT 'KRW',
	`listAmountKrw` int NOT NULL,
	`discountAmountKrw` int NOT NULL DEFAULT 0,
	`finalAmountKrw` int NOT NULL,
	`policyVersion` varchar(40) NOT NULL DEFAULT 'pending_legal_review',
	`expiresAt` timestamp NOT NULL,
	`paidAt` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_order_number_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`provider` enum('test','toss_pg','google_play') NOT NULL,
	`providerPaymentId` varchar(160),
	`providerOrderId` varchar(64),
	`status` enum('ready','processing','approved','failed','cancelled','refunded') NOT NULL DEFAULT 'ready',
	`idempotencyKey` varchar(128) NOT NULL,
	`rawPayloadEncrypted` text,
	`approvedAt` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_transactions_idempotency_unique` UNIQUE(`idempotencyKey`),
	CONSTRAINT `payment_transactions_provider_payment_unique` UNIQUE(`provider`,`providerPaymentId`)
);
--> statement-breakpoint
CREATE TABLE `product_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`amountKrw` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'KRW',
	`version` int NOT NULL,
	`validFrom` timestamp NOT NULL DEFAULT (now()),
	`validTo` timestamp,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_prices_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_prices_product_version_unique` UNIQUE(`productId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(80) NOT NULL,
	`name` varchar(200) NOT NULL,
	`fulfillmentType` enum('analysis','coaching') NOT NULL,
	`requiresPayment` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE INDEX `admin_audit_logs_entity_idx` ON `admin_audit_logs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `coupon_product_rules_product_idx` ON `coupon_product_rules` (`productId`);--> statement-breakpoint
CREATE INDEX `coupon_redemptions_coupon_state_idx` ON `coupon_redemptions` (`couponId`,`state`);--> statement-breakpoint
CREATE INDEX `customers_user_id_idx` ON `customers` (`userId`);--> statement-breakpoint
CREATE INDEX `entitlements_customer_product_idx` ON `entitlements` (`customerId`,`productId`,`status`);--> statement-breakpoint
CREATE INDEX `order_items_order_id_idx` ON `order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `orders_customer_status_idx` ON `orders` (`customerId`,`status`);--> statement-breakpoint
CREATE INDEX `orders_guest_status_idx` ON `orders` (`guestEmailHash`,`status`);--> statement-breakpoint
CREATE INDEX `payment_transactions_order_idx` ON `payment_transactions` (`orderId`);--> statement-breakpoint
CREATE INDEX `product_prices_active_idx` ON `product_prices` (`productId`,`active`);
--> statement-breakpoint
INSERT INTO `products` (`code`, `name`, `fulfillmentType`, `requiresPayment`, `active`) VALUES
  ('free_color_trial', '무료 컬러 체험', 'analysis', false, true),
  ('personal_deep', '컬러 + 심리카드 개인 심화분석', 'analysis', true, true),
  ('couple_love_deep', '부부 · 연인 관계 심화분석', 'analysis', true, true),
  ('parent_child_deep', '부모 · 자녀 관계 심화분석', 'analysis', true, true),
  ('friend_relationship', '친구 관계 분석', 'analysis', false, true),
  ('personal_coaching', '1:1 개인 코칭', 'coaching', true, false),
  ('couple_coaching', '부부 · 커플 코칭', 'coaching', true, false)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `fulfillmentType` = VALUES(`fulfillmentType`),
  `requiresPayment` = VALUES(`requiresPayment`),
  `active` = VALUES(`active`);
--> statement-breakpoint
INSERT INTO `product_prices` (`productId`, `amountKrw`, `currency`, `version`, `active`)
SELECT `id`,
  CASE `code`
    WHEN 'free_color_trial' THEN 0
    WHEN 'personal_deep' THEN 29000
    WHEN 'couple_love_deep' THEN 59000
    WHEN 'parent_child_deep' THEN 39000
    WHEN 'friend_relationship' THEN 0
  END,
  'KRW',
  1,
  true
FROM `products`
WHERE `code` IN ('free_color_trial', 'personal_deep', 'couple_love_deep', 'parent_child_deep', 'friend_relationship')
ON DUPLICATE KEY UPDATE
  `amountKrw` = VALUES(`amountKrw`),
  `currency` = VALUES(`currency`),
  `active` = VALUES(`active`);

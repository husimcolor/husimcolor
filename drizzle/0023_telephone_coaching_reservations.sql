ALTER TABLE `coaching_bookings` MODIFY COLUMN `sessionMode` enum('undecided','online','in_person','telephone') NOT NULL DEFAULT 'undecided';--> statement-breakpoint
ALTER TABLE `email_outbox` MODIFY COLUMN `purpose` enum('account_link','analysis_result_pdf','support_notification','coaching_booking_confirmation') NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `coaching_slot_holds` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderId` int NOT NULL,
  `productId` int NOT NULL,
  `bookingId` int,
  `slotStart` timestamp NOT NULL,
  `slotEnd` timestamp NOT NULL,
  `status` enum('held','confirmed','released','expired') NOT NULL DEFAULT 'held',
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `coaching_slot_holds_id` PRIMARY KEY(`id`),
  CONSTRAINT `coaching_slot_holds_order_unique` UNIQUE(`orderId`)
);--> statement-breakpoint
CREATE INDEX `coaching_slot_holds_range_status_idx` ON `coaching_slot_holds` (`status`,`slotStart`,`slotEnd`);--> statement-breakpoint
CREATE INDEX `coaching_slot_holds_booking_idx` ON `coaching_slot_holds` (`bookingId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `coaching_schedule_mutex` (
  `id` int NOT NULL,
  `version` int NOT NULL DEFAULT 0,
  CONSTRAINT `coaching_schedule_mutex_id` PRIMARY KEY(`id`)
);--> statement-breakpoint
INSERT IGNORE INTO `coaching_schedule_mutex` (`id`) VALUES (1);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `coaching_slot_claims` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderId` int,
  `bookingId` int,
  `bucketStart` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `coaching_slot_claims_id` PRIMARY KEY(`id`),
  CONSTRAINT `coaching_slot_claims_bucket_unique` UNIQUE(`bucketStart`)
);--> statement-breakpoint
CREATE INDEX `coaching_slot_claims_order_idx` ON `coaching_slot_claims` (`orderId`);--> statement-breakpoint
CREATE INDEX `coaching_slot_claims_booking_idx` ON `coaching_slot_claims` (`bookingId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `telephone_coaching_slot_settings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slotTime` varchar(5) NOT NULL,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `telephone_coaching_slot_settings_id` PRIMARY KEY(`id`),
  CONSTRAINT `telephone_coaching_slot_settings_time_unique` UNIQUE(`slotTime`)
);--> statement-breakpoint
INSERT INTO `telephone_coaching_slot_settings` (`slotTime`, `active`) VALUES
  ('10:00', true), ('11:30', true), ('14:00', true), ('16:00', true), ('19:00', true)
ON DUPLICATE KEY UPDATE `slotTime` = VALUES(`slotTime`);--> statement-breakpoint
INSERT INTO `products` (`code`, `name`, `fulfillmentType`, `requiresPayment`, `active`) VALUES
  ('telephone_coaching', '비대면 전화 코칭', 'coaching', true, false)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `fulfillmentType` = VALUES(`fulfillmentType`),
  `requiresPayment` = VALUES(`requiresPayment`);--> statement-breakpoint
INSERT INTO `product_prices` (`productId`, `regularAmountKrw`, `amountKrw`, `currency`, `version`, `active`)
SELECT `id`, 50000, 50000, 'KRW', 1, false
FROM `products`
WHERE `code` = 'telephone_coaching'
ON DUPLICATE KEY UPDATE
  `regularAmountKrw` = VALUES(`regularAmountKrw`),
  `amountKrw` = VALUES(`amountKrw`),
  `active` = VALUES(`active`);

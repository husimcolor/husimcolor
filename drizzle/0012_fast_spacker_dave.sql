CREATE TABLE `coaching_booking_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`adminUserId` int,
	`eventType` varchar(80) NOT NULL,
	`fromStatus` varchar(40),
	`toStatus` varchar(40),
	`payloadEncrypted` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coaching_booking_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `coaching_bookings` MODIFY COLUMN `status` enum('pending_schedule','change_requested','scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'pending_schedule';--> statement-breakpoint
ALTER TABLE `coaching_bookings` ADD `requestedWindowStart` timestamp;--> statement-breakpoint
ALTER TABLE `coaching_bookings` ADD `requestedWindowEnd` timestamp;--> statement-breakpoint
ALTER TABLE `coaching_bookings` ADD `sessionMode` enum('undecided','online','in_person') DEFAULT 'undecided' NOT NULL;--> statement-breakpoint
ALTER TABLE `coaching_bookings` ADD `scheduledEndAt` timestamp;--> statement-breakpoint
ALTER TABLE `coaching_bookings` ADD `timezone` varchar(64) DEFAULT 'Asia/Seoul' NOT NULL;--> statement-breakpoint
ALTER TABLE `coaching_bookings` ADD `assignedAdminUserId` int;--> statement-breakpoint
ALTER TABLE `coaching_bookings` ADD `internalNoteEncrypted` text;--> statement-breakpoint
ALTER TABLE `coaching_bookings` ADD `cancelledAt` timestamp;--> statement-breakpoint
ALTER TABLE `coaching_bookings` ADD `cancelReason` varchar(500);--> statement-breakpoint
ALTER TABLE `coaching_bookings` ADD `completedAt` timestamp;--> statement-breakpoint
ALTER TABLE `coaching_bookings` ADD `noShowAt` timestamp;--> statement-breakpoint
CREATE INDEX `coaching_booking_events_booking_idx` ON `coaching_booking_events` (`bookingId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `coaching_bookings_schedule_status_idx` ON `coaching_bookings` (`status`,`scheduledAt`);--> statement-breakpoint
INSERT INTO `products` (`code`, `name`, `fulfillmentType`, `requiresPayment`, `active`) VALUES
  ('relationship_coaching', '기타 관계 코칭', 'coaching', true, false)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `fulfillmentType` = VALUES(`fulfillmentType`),
  `requiresPayment` = VALUES(`requiresPayment`),
  `active` = VALUES(`active`);

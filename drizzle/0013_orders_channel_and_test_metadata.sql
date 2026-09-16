ALTER TABLE `orders` ADD `channel` enum('app','web') NOT NULL DEFAULT 'app';--> statement-breakpoint
ALTER TABLE `orders` ADD `isTest` boolean NOT NULL DEFAULT false;--> statement-breakpoint
CREATE INDEX `orders_channel_test_status_idx` ON `orders` (`channel`,`isTest`,`status`);

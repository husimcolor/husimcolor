CREATE TABLE `payment_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderName` varchar(100) NOT NULL,
	`contact` varchar(100) NOT NULL,
	`depositorName` varchar(100) NOT NULL,
	`amount` int NOT NULL DEFAULT 30000,
	`status` enum('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
	`memo` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_records_id` PRIMARY KEY(`id`)
);

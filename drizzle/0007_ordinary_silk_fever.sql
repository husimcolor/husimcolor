CREATE TABLE `couple_shared_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shareId` varchar(64) NOT NULL,
	`resultSnapshot` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `couple_shared_results_id` PRIMARY KEY(`id`),
	CONSTRAINT `couple_shared_results_shareId_unique` UNIQUE(`shareId`)
);

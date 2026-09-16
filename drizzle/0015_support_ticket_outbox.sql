CREATE TABLE `support_tickets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NULL,
  `contactEmailHash` varchar(128) NOT NULL,
  `contactEmailEncrypted` text NOT NULL,
  `subject` varchar(160) NOT NULL,
  `messageEncrypted` text NOT NULL,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closedAt` timestamp NULL,
  CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);--> statement-breakpoint
CREATE INDEX `support_tickets_user_status_idx` ON `support_tickets` (`userId`,`status`);--> statement-breakpoint
ALTER TABLE `email_outbox` MODIFY `purpose` enum('account_link','analysis_result_pdf','support_notification') NOT NULL;--> statement-breakpoint
ALTER TABLE `email_outbox` ADD `supportTicketId` int NULL;--> statement-breakpoint
CREATE INDEX `email_outbox_support_ticket_idx` ON `email_outbox` (`supportTicketId`);

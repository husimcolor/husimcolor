ALTER TABLE `account_link_challenges` ADD `codeEncrypted` text NULL;--> statement-breakpoint
ALTER TABLE `email_outbox` ADD `accountLinkChallengeId` int NULL;--> statement-breakpoint
CREATE INDEX `email_outbox_account_link_challenge_idx` ON `email_outbox` (`accountLinkChallengeId`);

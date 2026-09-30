CREATE TABLE `relationship_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipSessionId` int NOT NULL,
	`participant` enum('A','B') NOT NULL,
	`status` enum('not_started','in_progress','submitted') NOT NULL DEFAULT 'not_started',
	`consentAccepted` boolean NOT NULL DEFAULT false,
	`consentAcceptedAt` timestamp,
	`draftEncrypted` text,
	`submittedEncrypted` text,
	`draftRevision` int NOT NULL DEFAULT 0,
	`startedAt` timestamp,
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relationship_participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `relationship_participants_session_slot_unique` UNIQUE(`relationshipSessionId`,`participant`)
);
--> statement-breakpoint
CREATE TABLE `relationship_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionCode` varchar(64) NOT NULL,
	`analysisRunId` int NOT NULL,
	`entitlementId` int NOT NULL,
	`orderId` int,
	`productId` int NOT NULL,
	`relationType` varchar(50) NOT NULL,
	`mode` enum('invite_link') NOT NULL DEFAULT 'invite_link',
	`status` enum('collecting','awaiting_partner','report_generating','email_pending','completed','failed') NOT NULL DEFAULT 'collecting',
	`ownerTokenHash` varchar(128) NOT NULL,
	`inviteTokenHash` varchar(128) NOT NULL,
	`resultTokenHash` varchar(128) NOT NULL,
	`resultSnapshotEncrypted` text,
	`reportErrorCode` varchar(160),
	`reportGeneratedAt` timestamp,
	`emailDeliveredAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relationship_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `relationship_sessions_code_unique` UNIQUE(`sessionCode`),
	CONSTRAINT `relationship_sessions_analysis_run_unique` UNIQUE(`analysisRunId`),
	CONSTRAINT `relationship_sessions_invite_token_unique` UNIQUE(`inviteTokenHash`)
);
--> statement-breakpoint
CREATE INDEX `relationship_participants_session_status_idx` ON `relationship_participants` (`relationshipSessionId`,`status`);--> statement-breakpoint
CREATE INDEX `relationship_sessions_status_idx` ON `relationship_sessions` (`status`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `relationship_sessions_order_idx` ON `relationship_sessions` (`orderId`);
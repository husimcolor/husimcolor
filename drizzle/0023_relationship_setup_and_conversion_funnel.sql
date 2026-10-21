-- Additive only. Do not run on Production until the approved protected migration path
-- has verified the target DB identity and existing migration lineage. No customer/order/result rows are changed.
ALTER TABLE `relationship_participants`
  ADD COLUMN `assignedRoleEncrypted` text NULL AFTER `consentAcceptedAt`;
--> statement-breakpoint
CREATE TABLE `relationship_setups` (
  `id` int AUTO_INCREMENT NOT NULL,
  `entitlementId` int NOT NULL,
  `productCode` varchar(64) NOT NULL,
  `configurationEncrypted` text NOT NULL,
  `configuredAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `relationship_setups_id` PRIMARY KEY(`id`),
  CONSTRAINT `relationship_setups_entitlement_unique` UNIQUE(`entitlementId`)
);
--> statement-breakpoint
CREATE INDEX `relationship_setups_product_idx` ON `relationship_setups` (`productCode`);
--> statement-breakpoint
CREATE TABLE `commerce_funnel_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `eventKey` varchar(255) NOT NULL,
  `deviceId` varchar(128) NOT NULL,
  `eventType` enum('free_result','paid_guide_click','sample_view','checkout_view','toss_request','payment_success','payment_cancelled','payment_failed') NOT NULL,
  `productCode` enum('free_color_trial','personal_deep','couple_love_deep','parent_child_deep') NOT NULL,
  `locale` varchar(35) NOT NULL DEFAULT 'ko-KR',
  `channel` enum('app','web') NOT NULL,
  `isTest` boolean NOT NULL DEFAULT false,
  `occurredAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `commerce_funnel_events_id` PRIMARY KEY(`id`),
  CONSTRAINT `commerce_funnel_events_event_key_unique` UNIQUE(`eventKey`)
);
--> statement-breakpoint
CREATE INDEX `commerce_funnel_events_rollup_idx`
  ON `commerce_funnel_events` (`occurredAt`,`productCode`,`locale`,`channel`,`isTest`,`eventType`,`deviceId`);

-- Apply each environment only after its separately approved rollout and schema check.
-- The change is additive: it never resets, seeds, or deletes existing commerce data.
ALTER TABLE `coupons` ADD COLUMN `assignedCustomerId` int;
--> statement-breakpoint
CREATE INDEX `coupons_assigned_customer_idx` ON `coupons` (`assignedCustomerId`,`status`);

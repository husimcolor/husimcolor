-- Apply only to the isolated Preview database during PR #9 validation.
-- Production migration and coupon configuration require a separate approved rollout.
ALTER TABLE `coupons` ADD COLUMN `assignedCustomerId` int;
--> statement-breakpoint
CREATE INDEX `coupons_assigned_customer_idx` ON `coupons` (`assignedCustomerId`,`status`);

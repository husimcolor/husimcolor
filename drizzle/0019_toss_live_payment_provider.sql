-- Production application is performed only through the legacy-admin guarded
-- additive migration route after schema identity verification. The SQL is kept
-- in source so Preview/Production schema histories remain auditable.
-- Add a distinct provider value so live Toss orders cannot be mixed with test-key orders.
ALTER TABLE `payment_transactions`
  MODIFY COLUMN `provider` enum('test','toss_pg','toss_live','google_play','coupon') NOT NULL;-->
statement-breakpoint

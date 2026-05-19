ALTER TABLE `visitor_logs` MODIFY COLUMN `visitType` enum('home','free_trial','premium','free_start','free_result','deep_start','deep_result','couple_start','couple_result') NOT NULL DEFAULT 'home';--> statement-breakpoint
ALTER TABLE `visitor_logs` ADD `testType` varchar(50);--> statement-breakpoint
ALTER TABLE `visitor_logs` ADD `relationshipType` varchar(50);--> statement-breakpoint
ALTER TABLE `visitor_logs` ADD `selectedColors` varchar(255);--> statement-breakpoint
ALTER TABLE `visitor_logs` ADD `selectedCards` varchar(255);
-- Preserve historical pre-marriage applications and add fields for new two-person coaching applications.
-- No order, payment, entitlement, PDF, email, or capacity-limit tables are changed.
ALTER TABLE `year_end_three_color_experience_requests`
  MODIFY COLUMN `productCode` enum('personal_three_color_experience','engaged_couple_three_color_experience','relationship_coaching_experience') NOT NULL;

ALTER TABLE `year_end_three_color_experience_requests`
  ADD COLUMN `relationshipType` enum('married_couple','lovers','parent_child') NULL,
  ADD COLUMN `childAgeEncrypted` text NULL;

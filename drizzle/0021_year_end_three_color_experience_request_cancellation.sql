-- Additive cancellation metadata for the 2026 year-end three-color experience event.
-- This event deliberately does not enforce date-by-product capacity at either application or confirmation time.
ALTER TABLE `year_end_three_color_experience_requests`
  ADD COLUMN `cancellationReasonEncrypted` text NULL;

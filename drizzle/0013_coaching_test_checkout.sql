UPDATE `products`
SET `name` = CASE `code`
  WHEN 'personal_coaching' THEN '1:1 프리미엄 컬러심리 코칭'
  WHEN 'couple_coaching' THEN '부부 · 커플 관계 코칭'
  ELSE `name`
END,
`active` = true
WHERE `code` IN ('personal_coaching', 'couple_coaching');
--> statement-breakpoint
UPDATE `product_prices` AS pp
INNER JOIN `products` AS p ON p.`id` = pp.`productId`
SET pp.`active` = true
WHERE p.`code` IN ('personal_coaching', 'couple_coaching')
  AND pp.`version` = 1;

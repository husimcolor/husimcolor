import mysql from "mysql2/promise";

const requiredConfirmation = "CONFIRM_TELEPHONE_COACHING_LIVE";
if (process.env.COMMERCE_TELEPHONE_COACHING_RELEASE !== requiredConfirmation) {
  throw new Error("Explicit telephone coaching live release confirmation is required");
}
if (process.env.VERCEL_ENV !== "production") {
  throw new Error("Telephone coaching live release is production-only");
}
if (process.env.COMMERCE_LIVE_PAYMENT_ENABLED !== "true") {
  throw new Error("Live payment gate must be enabled before telephone coaching release");
}
const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error("DATABASE_URL is required for telephone coaching live release");

const uri = rawUrl.replace(/[?&]ssl=[^&]*/g, "").replace(/\?$/, "");
const connection = await mysql.createConnection({
  uri,
  ssl: { rejectUnauthorized: false, minVersion: "TLSv1.2" },
});

try {
  await connection.beginTransaction();
  const [productRows] = await connection.query(
    "SELECT `id` FROM `products` WHERE `code` = 'telephone_coaching' LIMIT 1 FOR UPDATE",
  );
  const productId = Array.isArray(productRows) ? productRows[0]?.id : null;
  if (!productId) {
    throw new Error("Telephone coaching product is missing; run the additive schema preparation first");
  }

  const [priceRows] = await connection.query(
    "SELECT `id` FROM `product_prices` WHERE `productId` = ? AND `amountKrw` = 50000 AND `currency` = 'KRW' LIMIT 1 FOR UPDATE",
    [productId],
  );
  const priceId = Array.isArray(priceRows) ? priceRows[0]?.id : null;
  if (!priceId) {
    throw new Error("Telephone coaching 50,000 KRW price is missing; run the additive schema preparation first");
  }

  await connection.query("UPDATE `products` SET `active` = true WHERE `id` = ?", [productId]);
  await connection.query("UPDATE `product_prices` SET `active` = true WHERE `id` = ?", [priceId]);
  await connection.commit();
  console.log("telephone coaching live release completed");
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}

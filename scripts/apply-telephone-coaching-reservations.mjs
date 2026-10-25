import mysql from "mysql2/promise";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error("DATABASE_URL is required for telephone-coaching schema preparation");

const uri = rawUrl.replace(/[?&]ssl=[^&]*/g, "").replace(/\?$/, "");
const connection = await mysql.createConnection({ uri, ssl: { rejectUnauthorized: false, minVersion: "TLSv1.2" } });

async function hasTable(name) {
  const [rows] = await connection.query("SHOW TABLES LIKE ?", [name]);
  return Array.isArray(rows) && rows.length > 0;
}

async function hasColumn(table, column) {
  const [rows] = await connection.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

try {
  const sessionMode = await hasColumn("coaching_bookings", "sessionMode");
  if (!sessionMode) throw new Error("coaching_bookings.sessionMode is required before telephone-coaching preparation");
  if (!String(sessionMode.Type ?? "").includes("telephone")) {
    await connection.query("ALTER TABLE `coaching_bookings` MODIFY COLUMN `sessionMode` enum('undecided','online','in_person','telephone') NOT NULL DEFAULT 'undecided'");
  }
  const outboxPurpose = await hasColumn("email_outbox", "purpose");
  if (!outboxPurpose) throw new Error("email_outbox.purpose is required before telephone-coaching preparation");
  if (!String(outboxPurpose.Type ?? "").includes("coaching_booking_confirmation")) {
    await connection.query("ALTER TABLE `email_outbox` MODIFY COLUMN `purpose` enum('account_link','analysis_result_pdf','support_notification','coaching_booking_confirmation') NOT NULL");
  }

  if (!await hasTable("coaching_slot_holds")) {
    await connection.query("CREATE TABLE `coaching_slot_holds` (`id` int AUTO_INCREMENT NOT NULL, `orderId` int NOT NULL, `productId` int NOT NULL, `bookingId` int NULL, `slotStart` timestamp NOT NULL, `slotEnd` timestamp NOT NULL, `status` enum('held','confirmed','released','expired') NOT NULL DEFAULT 'held', `expiresAt` timestamp NOT NULL, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `coaching_slot_holds_id` PRIMARY KEY(`id`), CONSTRAINT `coaching_slot_holds_order_unique` UNIQUE(`orderId`), INDEX `coaching_slot_holds_range_status_idx` (`status`,`slotStart`,`slotEnd`), INDEX `coaching_slot_holds_booking_idx` (`bookingId`))");
  }
  if (!await hasTable("coaching_schedule_mutex")) {
    await connection.query("CREATE TABLE `coaching_schedule_mutex` (`id` int NOT NULL, `version` int NOT NULL DEFAULT 0, CONSTRAINT `coaching_schedule_mutex_id` PRIMARY KEY(`id`))");
  } else if (!await hasColumn("coaching_schedule_mutex", "version")) {
    await connection.query("ALTER TABLE `coaching_schedule_mutex` ADD COLUMN `version` int NOT NULL DEFAULT 0");
  }
  await connection.query("INSERT IGNORE INTO `coaching_schedule_mutex` (`id`) VALUES (1)");
  if (!await hasTable("coaching_slot_claims")) {
    await connection.query("CREATE TABLE `coaching_slot_claims` (`id` int AUTO_INCREMENT NOT NULL, `orderId` int NULL, `bookingId` int NULL, `bucketStart` timestamp NOT NULL, `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `coaching_slot_claims_id` PRIMARY KEY(`id`), CONSTRAINT `coaching_slot_claims_bucket_unique` UNIQUE(`bucketStart`), INDEX `coaching_slot_claims_order_idx` (`orderId`), INDEX `coaching_slot_claims_booking_idx` (`bookingId`))");
  }
  if (!await hasTable("telephone_coaching_slot_settings")) {
    await connection.query("CREATE TABLE `telephone_coaching_slot_settings` (`id` int AUTO_INCREMENT NOT NULL, `slotTime` varchar(5) NOT NULL, `active` boolean NOT NULL DEFAULT true, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `telephone_coaching_slot_settings_id` PRIMARY KEY(`id`), CONSTRAINT `telephone_coaching_slot_settings_time_unique` UNIQUE(`slotTime`))");
  }
  await connection.query("INSERT INTO `telephone_coaching_slot_settings` (`slotTime`, `active`) VALUES ('10:00', true), ('11:30', true), ('14:00', true), ('16:00', true), ('19:00', true), ('20:00', true) ON DUPLICATE KEY UPDATE `slotTime` = VALUES(`slotTime`)");

  await connection.query("INSERT INTO `products` (`code`, `name`, `fulfillmentType`, `requiresPayment`, `active`) VALUES ('telephone_coaching', '비대면 전화 코칭', 'coaching', true, false) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `fulfillmentType` = VALUES(`fulfillmentType`), `requiresPayment` = VALUES(`requiresPayment`)");
  const [products] = await connection.query("SELECT `id` FROM `products` WHERE `code` = 'telephone_coaching' LIMIT 1");
  const productId = Array.isArray(products) ? products[0]?.id : null;
  if (!productId) throw new Error("telephone-coaching product setup failed");
  await connection.query("INSERT INTO `product_prices` (`productId`, `regularAmountKrw`, `amountKrw`, `currency`, `version`, `active`) VALUES (?, 50000, 50000, 'KRW', 1, false) ON DUPLICATE KEY UPDATE `regularAmountKrw` = VALUES(`regularAmountKrw`), `amountKrw` = VALUES(`amountKrw`), `active` = VALUES(`active`)", [productId]);

  const modeAfter = await hasColumn("coaching_bookings", "sessionMode");
  if (!String(modeAfter?.Type ?? "").includes("telephone") || !await hasTable("coaching_slot_holds") || !await hasTable("coaching_schedule_mutex") || !await hasTable("telephone_coaching_slot_settings")) {
    throw new Error("telephone-coaching schema verification failed");
  }
  console.log("telephone coaching schema ready; product remains inactive until an explicit release step");
} finally {
  await connection.end();
}

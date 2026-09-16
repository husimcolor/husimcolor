import { emailOutbox, supportTickets } from "../../drizzle/schema";
import type { AuthenticatedUser } from "../_core/sdk";
import { getDb } from "../db";
import { encryptCommerceEmail, encryptCommerceValue, hashCommerceEmail } from "./crypto";

export async function createSupportInquiry(input: {
  user: AuthenticatedUser;
  email: string;
  subject: string;
  message: string;
}) {
  const supportEmail = process.env.SUPPORT_EMAIL?.trim().toLowerCase();
  if (!supportEmail) throw new Error("SUPPORT_EMAIL_NOT_CONFIGURED");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const ticket = await db.transaction(async (tx) => {
    const ticketInsert = await tx.insert(supportTickets).values({
      userId: input.user.id,
      contactEmailHash: hashCommerceEmail(input.email),
      contactEmailEncrypted: encryptCommerceEmail(input.email),
      subject: input.subject.trim(),
      messageEncrypted: encryptCommerceValue(input.message.trim()),
    });
    const ticketId = Number(ticketInsert[0].insertId);
    const outboxInsert = await tx.insert(emailOutbox).values({
      userId: input.user.id,
      supportTicketId: ticketId,
      purpose: "support_notification",
      toEmailHash: hashCommerceEmail(supportEmail),
      toEmailEncrypted: encryptCommerceEmail(supportEmail),
      status: "queued",
      nextAttemptAt: new Date(),
    });
    return { ticketId, outboxId: Number(outboxInsert[0].insertId) };
  });
  return ticket;
}

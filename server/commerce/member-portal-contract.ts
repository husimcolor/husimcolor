export const SUPPORT_INQUIRY_TYPES = [
  "payment_refund",
  "analysis_result",
  "pdf_email",
  "coaching_booking",
  "other",
] as const;

export type SupportInquiryType = (typeof SUPPORT_INQUIRY_TYPES)[number];

export const SUPPORT_TICKET_STATUSES = ["received", "reviewing", "answered"] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

const supportStatusTransitions: Record<SupportTicketStatus, readonly SupportTicketStatus[]> = {
  received: ["received", "reviewing"],
  reviewing: ["reviewing", "answered"],
  answered: ["answered"],
};

export function canTransitionSupportTicketStatus(from: SupportTicketStatus, to: SupportTicketStatus): boolean {
  return supportStatusTransitions[from].includes(to);
}

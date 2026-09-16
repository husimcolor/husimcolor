import { describe, expect, it } from "vitest";
import {
  SUPPORT_INQUIRY_TYPES,
  SUPPORT_TICKET_STATUSES,
  canTransitionSupportTicketStatus,
} from "../server/commerce/member-portal-contract";

describe("member portal support-ticket contract", () => {
  it("defines only the five approved inquiry categories", () => {
    expect(SUPPORT_INQUIRY_TYPES).toEqual(["payment_refund", "analysis_result", "pdf_email", "coaching_booking", "other"]);
  });

  it("keeps the received → reviewing → answered lifecycle one-way", () => {
    expect(SUPPORT_TICKET_STATUSES).toEqual(["received", "reviewing", "answered"]);
    expect(canTransitionSupportTicketStatus("received", "reviewing")).toBe(true);
    expect(canTransitionSupportTicketStatus("reviewing", "answered")).toBe(true);
    expect(canTransitionSupportTicketStatus("received", "answered")).toBe(false);
    expect(canTransitionSupportTicketStatus("answered", "reviewing")).toBe(false);
  });
});

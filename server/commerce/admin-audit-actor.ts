export type AdminAuditActor = {
  adminUserId: number | null;
  subject: "authenticated_admin" | "legacy_password_admin";
};

export function resolveAdminAuditActor(input: {
  adminUserId: number | null | undefined;
  legacyAdmin?: boolean;
}): AdminAuditActor {
  if (typeof input.adminUserId === "number" && input.adminUserId > 0) {
    return { adminUserId: input.adminUserId, subject: "authenticated_admin" };
  }
  if (input.legacyAdmin) {
    return { adminUserId: null, subject: "legacy_password_admin" };
  }
  throw new Error("ADMIN_AUDIT_ACTOR_MISSING");
}

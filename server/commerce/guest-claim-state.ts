export function isRestorableGuestClaim(input: {
  status: string;
  expiresAt: Date;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  return input.status === "pending" && input.expiresAt.getTime() > now.getTime();
}

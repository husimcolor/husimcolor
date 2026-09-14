export function isAuthorizedOutboxCronRequest(authorization: string | undefined, secret = process.env.CRON_SECRET): boolean {
  if (!secret || secret.length < 32) return false;
  return authorization === `Bearer ${secret}`;
}

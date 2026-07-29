export const LOGIN_CODE_RESEND_INTERVAL_MS = 30_000;
export const LOGIN_CODE_HOURLY_LIMIT = 10;

export function isLoginCodeSendRateLimited({
  recentCreatedAt,
  hourlyTotal,
  now,
}: {
  recentCreatedAt: number | null;
  hourlyTotal: number;
  now: number;
}) {
  return (
    (recentCreatedAt !== null && now - recentCreatedAt < LOGIN_CODE_RESEND_INTERVAL_MS)
    || hourlyTotal >= LOGIN_CODE_HOURLY_LIMIT
  );
}

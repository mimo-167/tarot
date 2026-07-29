import { describe, expect, it } from "vitest";
import {
  isLoginCodeSendRateLimited,
  LOGIN_CODE_HOURLY_LIMIT,
  LOGIN_CODE_RESEND_INTERVAL_MS,
} from "@/lib/auth-policy";

describe("login code send policy", () => {
  const now = 1_000_000;

  it("allows another code after thirty seconds", () => {
    expect(isLoginCodeSendRateLimited({
      recentCreatedAt: now - LOGIN_CODE_RESEND_INTERVAL_MS + 1,
      hourlyTotal: 1,
      now,
    })).toBe(true);
    expect(isLoginCodeSendRateLimited({
      recentCreatedAt: now - LOGIN_CODE_RESEND_INTERVAL_MS,
      hourlyTotal: 1,
      now,
    })).toBe(false);
  });

  it("allows the tenth code per hour and limits the eleventh request", () => {
    expect(isLoginCodeSendRateLimited({
      recentCreatedAt: null,
      hourlyTotal: LOGIN_CODE_HOURLY_LIMIT - 1,
      now,
    })).toBe(false);
    expect(isLoginCodeSendRateLimited({
      recentCreatedAt: null,
      hourlyTotal: LOGIN_CODE_HOURLY_LIMIT,
      now,
    })).toBe(true);
  });
});

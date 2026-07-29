import { NextResponse } from "next/server";
import { isLocale, localeFromAcceptLanguage, type Locale } from "@/i18n/config";
import {
  HttpError,
  createSession,
  hmacHex,
  isSameOrigin,
  migrateGuestPreviews,
  normalizeEmail,
  safeEqual,
  type UserRole,
  type UserStatus,
} from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CodeRow = {
  id: string;
  code_hash: string;
  salt: string;
  attempts: number;
  expires_at: number;
};

type UserRow = {
  id: string;
  email: string;
  role: UserRole;
  locale: Locale;
  status: UserStatus;
  created_at: number;
  last_login_at: number;
};

const messages: Record<Locale, Record<string, string>> = {
  "zh-CN": {
    invalid: "邮箱或验证码格式无效。",
    wrong: "验证码不正确或已经失效。",
    attempts: "验证码尝试次数过多，请重新获取。",
    suspended: "该账号已被暂停使用。",
  },
  en: {
    invalid: "The email or login code is invalid.",
    wrong: "That code is incorrect or has expired.",
    attempts: "Too many attempts. Request a new code.",
    suspended: "This account has been suspended.",
  },
};

function resolveLocale(request: Request, parsed: Record<string, unknown>): Locale {
  return isLocale(parsed.locale as string)
    ? parsed.locale as Locale
    : localeFromAcceptLanguage(request.headers.get("accept-language"));
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      throw new HttpError(403, "ORIGIN_REJECTED", "Request origin was rejected");
    }
    if (Number(request.headers.get("content-length") || 0) > 2_048) {
      throw new HttpError(413, "REQUEST_TOO_LARGE", "Request is too large");
    }
    const parsed = await request.json() as Record<string, unknown>;
    const locale = resolveLocale(request, parsed);
    const copy = messages[locale];
    const email = normalizeEmail(parsed.email);
    const code = typeof parsed.code === "string" ? parsed.code.trim() : "";
    if (!email || !/^\d{6}$/.test(code)) {
      throw new HttpError(400, "INVALID_CODE", copy.invalid);
    }

    const env = getRuntimeEnv();
    const ip = request.headers.get("cf-connecting-ip") || "local";
    const limited = await env.AUTH_RATE_LIMITER.limit({
      key: `verify:${await hmacHex(env.AUTH_SECRET, `${ip}:${email}`)}`,
    });
    if (!limited.success) {
      throw new HttpError(429, "VERIFY_RATE_LIMITED", copy.attempts);
    }

    const now = Date.now();
    const codeRow = await env.DB.prepare(
      `SELECT id, code_hash, salt, attempts, expires_at
       FROM login_codes
       WHERE email = ? AND consumed_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
    )
      .bind(email)
      .first<CodeRow>();
    if (!codeRow || codeRow.expires_at <= now) {
      throw new HttpError(400, "CODE_EXPIRED", copy.wrong);
    }
    if (codeRow.attempts >= 5) {
      throw new HttpError(429, "CODE_ATTEMPTS_EXCEEDED", copy.attempts);
    }

    const providedHash = await hmacHex(env.AUTH_SECRET, `${email}:${code}:${codeRow.salt}`);
    if (!await safeEqual(providedHash, codeRow.code_hash)) {
      await env.DB.prepare("UPDATE login_codes SET attempts = attempts + 1 WHERE id = ?")
        .bind(codeRow.id)
        .run();
      throw new HttpError(400, "CODE_INCORRECT", copy.wrong);
    }
    const consumed = await env.DB.prepare(
      `UPDATE login_codes SET consumed_at = ?
       WHERE id = ? AND consumed_at IS NULL AND attempts < 5`,
    )
      .bind(now, codeRow.id)
      .run();
    if (!consumed.meta.changes) {
      throw new HttpError(400, "CODE_EXPIRED", copy.wrong);
    }

    const adminEmail = env.ADMIN_EMAIL.trim().toLowerCase();
    const expectedRole: UserRole = email === adminEmail ? "admin" : "member";
    let user = await env.DB.prepare(
      `SELECT id, email, role, locale, status, created_at, last_login_at
       FROM users WHERE email = ? LIMIT 1`,
    )
      .bind(email)
      .first<UserRow>();
    if (user?.status === "suspended") {
      throw new HttpError(403, "ACCOUNT_SUSPENDED", copy.suspended);
    }

    const userId = user?.id || crypto.randomUUID();
    if (user) {
      await env.DB.prepare(
        `UPDATE users
         SET role = ?, locale = ?, updated_at = ?, last_login_at = ?
         WHERE id = ?`,
      )
        .bind(expectedRole, locale, now, now, userId)
        .run();
    } else {
      await env.DB.prepare(
        `INSERT INTO users
         (id, email, role, locale, status, created_at, updated_at, last_login_at)
         VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`,
      )
        .bind(userId, email, expectedRole, locale, now, now, now)
        .run();
    }

    await createSession(request, userId);
    await migrateGuestPreviews(request, userId);

    user = await env.DB.prepare(
      `SELECT id, email, role, locale, status, created_at, last_login_at
       FROM users WHERE id = ? LIMIT 1`,
    )
      .bind(userId)
      .first<UserRow>();

    return NextResponse.json({
      user: user && {
        id: user.id,
        email: user.email,
        role: user.role,
        locale: user.locale,
        status: user.status,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
      },
    }, { headers: { "Content-Language": locale } });
  } catch (error) {
    return apiError(error);
  }
}

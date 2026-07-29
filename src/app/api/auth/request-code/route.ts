import { NextResponse } from "next/server";
import { isLocale, localeFromAcceptLanguage, type Locale } from "@/i18n/config";
import {
  HttpError,
  hmacHex,
  isSameOrigin,
  normalizeEmail,
  randomToken,
  sha256,
} from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { sendLoginCode } from "@/lib/email";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RecentCodeRow = { created_at: number };
type CountRow = { total: number };

const messages: Record<Locale, Record<string, string>> = {
  "zh-CN": {
    invalid: "请输入有效的邮箱地址。",
    frequent: "验证码发送有些频繁，请稍后再试。",
    sent: "验证码已发送，请检查邮箱。",
    unavailable: "验证码邮件暂时无法发送，请稍后再试。",
  },
  en: {
    invalid: "Enter a valid email address.",
    frequent: "Too many codes have been requested. Please wait and try again.",
    sent: "Your code has been sent. Check your inbox.",
    unavailable: "The login email could not be sent. Please try again later.",
  },
};

function createOtp() {
  const maximum = 4_294_000_000;
  const values = new Uint32Array(1);
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= maximum);
  return String(values[0] % 1_000_000).padStart(6, "0");
}

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
    if (!email) throw new HttpError(400, "INVALID_EMAIL", copy.invalid);

    const env = getRuntimeEnv();
    const ip = request.headers.get("cf-connecting-ip") || "local";
    const rateKey = await sha256(`${ip}:${email}`);
    const limited = await env.AUTH_RATE_LIMITER.limit({ key: `send:${rateKey}` });
    if (!limited.success) {
      throw new HttpError(429, "CODE_RATE_LIMITED", copy.frequent);
    }

    const now = Date.now();
    const [recentResult, hourlyResult] = await env.DB.batch<RecentCodeRow | CountRow>([
      env.DB.prepare(
        "SELECT created_at FROM login_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1",
      ).bind(email),
      env.DB.prepare(
        "SELECT COUNT(*) AS total FROM login_codes WHERE email = ? AND created_at > ?",
      ).bind(email, now - 60 * 60 * 1000),
    ]);
    const recent = recentResult.results[0] as RecentCodeRow | undefined;
    const hourly = hourlyResult.results[0] as CountRow | undefined;
    if ((recent && now - recent.created_at < 60_000) || (hourly?.total || 0) >= 5) {
      throw new HttpError(429, "CODE_RATE_LIMITED", copy.frequent);
    }
    await env.DB.prepare("DELETE FROM login_codes WHERE expires_at < ?")
      .bind(now - 60 * 60 * 1000)
      .run();

    const code = createOtp();
    const salt = randomToken(16);
    const id = crypto.randomUUID();
    const codeHash = await hmacHex(env.AUTH_SECRET, `${email}:${code}:${salt}`);
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE login_codes SET consumed_at = ? WHERE email = ? AND consumed_at IS NULL",
      ).bind(now, email),
      env.DB.prepare(
        `INSERT INTO login_codes
         (id, email, code_hash, salt, locale, attempts, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      ).bind(id, email, codeHash, salt, locale, now, now + 5 * 60 * 1000),
    ]);

    try {
      await sendLoginCode(email, code, locale);
    } catch (error) {
      await env.DB.prepare("UPDATE login_codes SET consumed_at = ? WHERE id = ?")
        .bind(Date.now(), id)
        .run();
      console.error(JSON.stringify({
        message: "Login email failed",
        error: error instanceof Error ? error.message : String(error),
      }));
      throw new HttpError(503, "EMAIL_UNAVAILABLE", copy.unavailable);
    }

    return NextResponse.json({ message: copy.sent }, {
      headers: { "Content-Language": locale },
    });
  } catch (error) {
    return apiError(error);
  }
}

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { isLocale, localeFromAcceptLanguage, type Locale } from "@/i18n/config";
import { buildUserPrompt, SYSTEM_PROMPTS } from "@/lib/reading-prompt";
import {
  validateReadingRequest,
  type ValidationErrorCode,
} from "@/lib/reading-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TarotEnv = {
  AI_RATE_LIMITER?: { limit: (input: { key: string }) => Promise<{ success: boolean }> };
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_API_URL?: string;
  DEEPSEEK_MODEL?: string;
};

type RuntimeErrorCode =
  | "INVALID_JSON"
  | "RATE_LIMITED"
  | "AI_NOT_CONFIGURED"
  | "UPSTREAM_ERROR"
  | "AI_TIMEOUT";

type ApiErrorCode = ValidationErrorCode | RuntimeErrorCode;

const errorMessages: Record<Locale, Record<ApiErrorCode, string>> = {
  "zh-CN": {
    INVALID_JSON: "请求不是有效的 JSON。",
    INVALID_REQUEST: "请求格式无效。",
    SPREAD_NOT_FOUND: "牌阵不存在。",
    CARD_COUNT_MISMATCH: "抽牌数量与牌阵不匹配。",
    INVALID_CARD_DATA: "抽牌数据无效。",
    INVALID_CARD: "抽牌中存在无效或重复牌。",
    INVALID_ORIENTATION: "正逆位数据无效。",
    OPTIONS_REQUIRED: "二选一牌阵需要填写 A、B 两个选项。",
    RATE_LIMITED: "请求有些频繁，请稍候一分钟再试。本地牌义仍可继续查看。",
    AI_NOT_CONFIGURED: "AI 辅助解读尚未配置服务密钥；本地牌义不受影响。",
    UPSTREAM_ERROR: "AI 解读暂时没有回应，请稍后再试。本地牌义仍可继续查看。",
    AI_TIMEOUT: "解读请求超时或网络异常，请稍后再试。本地牌义仍可继续查看。",
  },
  en: {
    INVALID_JSON: "The request body is not valid JSON.",
    INVALID_REQUEST: "The reading request is invalid.",
    SPREAD_NOT_FOUND: "That tarot spread does not exist.",
    CARD_COUNT_MISMATCH: "The number of cards does not match this spread.",
    INVALID_CARD_DATA: "The card data is invalid.",
    INVALID_CARD: "The draw contains an invalid or duplicate card.",
    INVALID_ORIENTATION: "A card orientation is invalid.",
    OPTIONS_REQUIRED: "This comparison spread requires both Option A and Option B.",
    RATE_LIMITED: "There have been too many requests. Please wait a minute and try again; local card meanings are still available.",
    AI_NOT_CONFIGURED: "AI-assisted readings are not configured yet; local card meanings are still available.",
    UPSTREAM_ERROR: "The AI reading service did not respond. Please try again later; local card meanings are still available.",
    AI_TIMEOUT: "The reading timed out or encountered a network error. Please try again later; local card meanings are still available.",
  },
};

function getRuntimeEnv(): TarotEnv {
  try {
    return getCloudflareContext().env as unknown as TarotEnv;
  } catch {
    return process.env as TarotEnv;
  }
}

function requestLocale(request: Request, parsed?: unknown): Locale {
  if (parsed && typeof parsed === "object") {
    const locale = (parsed as Record<string, unknown>).locale;
    if (typeof locale === "string" && isLocale(locale)) return locale;
  }
  const headerLocale = request.headers.get("x-tarot-locale");
  if (isLocale(headerLocale)) return headerLocale;
  return localeFromAcceptLanguage(request.headers.get("accept-language"));
}

function jsonResponse<T>(body: T, locale: Locale, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Content-Language": locale },
  });
}

function errorResponse(locale: Locale, code: ApiErrorCode, status: number) {
  return jsonResponse({ error: errorMessages[locale][code], code }, locale, status);
}

export async function POST(request: Request) {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return errorResponse(requestLocale(request), "INVALID_JSON", 400);
  }

  const locale = requestLocale(request, parsed);
  const validation = validateReadingRequest(parsed, locale);
  if (!validation.ok) {
    return errorResponse(locale, validation.code, 400);
  }

  const env = getRuntimeEnv();
  const clientId = (request.headers.get("x-tarot-client") || "anonymous").slice(0, 100);
  if (env.AI_RATE_LIMITER) {
    const limited = await env.AI_RATE_LIMITER.limit({ key: `reading:${clientId}` });
    if (!limited.success) return errorResponse(locale, "RATE_LIMITED", 429);
  }

  const apiKey = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return errorResponse(locale, "AI_NOT_CONFIGURED", 503);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);
  try {
    const response = await fetch(
      env.DEEPSEEK_API_URL || process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: env.DEEPSEEK_MODEL || process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPTS[locale] },
            { role: "user", content: buildUserPrompt(validation.request, validation.cards, locale) },
          ],
          thinking: { type: "disabled" },
          max_tokens: 2800,
          stream: false,
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error("DeepSeek API error", response.status, detail.slice(0, 500));
      return errorResponse(locale, "UPSTREAM_ERROR", 502);
    }

    const completion = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reading = completion.choices?.[0]?.message?.content?.trim();
    if (!reading) throw new Error("DeepSeek returned an empty response");
    return jsonResponse({ reading }, locale);
  } catch (error) {
    console.error("Tarot reading failed", error);
    return errorResponse(locale, "AI_TIMEOUT", 504);
  } finally {
    clearTimeout(timeout);
  }
}

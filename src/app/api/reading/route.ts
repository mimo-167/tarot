import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/reading-prompt";
import { validateReadingRequest } from "@/lib/reading-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TarotEnv = {
  AI_RATE_LIMITER?: { limit: (input: { key: string }) => Promise<{ success: boolean }> };
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_API_URL?: string;
  DEEPSEEK_MODEL?: string;
};

function getRuntimeEnv(): TarotEnv {
  try {
    return getCloudflareContext().env as unknown as TarotEnv;
  } catch {
    return process.env as TarotEnv;
  }
}

export async function POST(request: Request) {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "请求不是有效的 JSON。" }, { status: 400 });
  }

  const validation = validateReadingRequest(parsed);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const env = getRuntimeEnv();
  const clientId = (request.headers.get("x-tarot-client") || "anonymous").slice(0, 100);
  if (env.AI_RATE_LIMITER) {
    const limited = await env.AI_RATE_LIMITER.limit({ key: `reading:${clientId}` });
    if (!limited.success) {
      return NextResponse.json(
        { error: "请求有些频繁，请稍候一分钟再试。本地牌义仍可继续查看。", code: "RATE_LIMITED" },
        { status: 429 },
      );
    }
  }

  const apiKey = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI 辅助解读尚未配置服务密钥；本地牌义不受影响。", code: "AI_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(validation.request, validation.cards) },
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
      return NextResponse.json(
        { error: "AI 解读暂时没有回应，请稍后再试。本地牌义仍可继续查看。", code: "UPSTREAM_ERROR" },
        { status: 502 },
      );
    }

    const completion = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reading = completion.choices?.[0]?.message?.content?.trim();
    if (!reading) throw new Error("DeepSeek returned an empty response");
    return NextResponse.json({ reading });
  } catch (error) {
    console.error("Tarot reading failed", error);
    return NextResponse.json(
      { error: "解读请求超时或网络异常，请稍后再试。本地牌义仍可继续查看。", code: "AI_TIMEOUT" },
      { status: 504 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

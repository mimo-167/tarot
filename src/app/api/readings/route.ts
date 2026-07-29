import { NextResponse } from "next/server";
import { isLocale, localeFromAcceptLanguage } from "@/i18n/config";
import { apiError } from "@/lib/api-response";
import { HttpError, isSameOrigin, requireUser } from "@/lib/auth";
import { validateReadingRequest } from "@/lib/reading-validation";
import {
  createCardSnapshots,
  readingRowToJson,
  type ReadingRow,
} from "@/lib/saved-readings";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const page = Math.max(1, Number(new URL(request.url).searchParams.get("page")) || 1);
    const pageSize = 20;
    const offset = (page - 1) * pageSize;
    const env = getRuntimeEnv();
    const [countResult, rowsResult] = await env.DB.batch<ReadingRow | { total: number }>([
      env.DB.prepare("SELECT COUNT(*) AS total FROM readings WHERE user_id = ?")
        .bind(user.id),
      env.DB.prepare(
        `SELECT * FROM readings
         WHERE user_id = ?
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      ).bind(user.id, pageSize, offset),
    ]);
    const total = Number((countResult.results[0] as { total?: number } | undefined)?.total || 0);
    return NextResponse.json({
      readings: (rowsResult.results as ReadingRow[]).map(readingRowToJson),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      throw new HttpError(403, "ORIGIN_REJECTED", "Request origin was rejected");
    }
    const user = await requireUser();
    const parsed = await request.json() as Record<string, unknown>;
    const rawRequest = parsed.request as Record<string, unknown> | undefined;
    const locale = isLocale(rawRequest?.locale as string)
      ? rawRequest?.locale as "zh-CN" | "en"
      : localeFromAcceptLanguage(request.headers.get("accept-language"));
    const validation = validateReadingRequest(rawRequest, locale);
    if (!validation.ok) {
      throw new HttpError(400, validation.code, "The reading data is invalid");
    }
    const aiReading = typeof parsed.aiReading === "string"
      ? parsed.aiReading.trim().slice(0, 30_000)
      : "";
    const id = crypto.randomUUID();
    const now = Date.now();
    const normalized = validation.request;
    await getRuntimeEnv().DB.prepare(
      `INSERT INTO readings
       (id, user_id, locale, question, context, timeframe, spread_id, spread_name,
        spread_description, positions_json, options_json, cards_json, ai_reading,
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        user.id,
        locale,
        normalized.question,
        normalized.context || "",
        normalized.timeframe || "",
        normalized.spread.id,
        normalized.spread.name,
        normalized.spread.description,
        JSON.stringify(normalized.spread.positions),
        normalized.options ? JSON.stringify(normalized.options) : null,
        JSON.stringify(createCardSnapshots(normalized, validation.cards)),
        aiReading,
        now,
        now,
      )
      .run();
    return NextResponse.json({ id, savedAt: now }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

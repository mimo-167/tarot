import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { HttpError, isSameOrigin, requireUser } from "@/lib/auth";
import { getRuntimeEnv } from "@/lib/runtime-env";
import { readingRowToJson, type ReadingRow } from "@/lib/saved-readings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const row = await getRuntimeEnv().DB.prepare(
      "SELECT * FROM readings WHERE id = ? AND user_id = ? LIMIT 1",
    )
      .bind(id.slice(0, 64), user.id)
      .first<ReadingRow>();
    if (!row) throw new HttpError(404, "READING_NOT_FOUND", "Reading not found");
    return NextResponse.json({ reading: readingRowToJson(row) });
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(request: Request, context: RouteContext) {
  try {
    if (!isSameOrigin(request)) {
      throw new HttpError(403, "ORIGIN_REJECTED", "Request origin was rejected");
    }
    const user = await requireUser();
    const { id } = await context.params;
    const parsed = await request.json() as Record<string, unknown>;
    const aiReading = typeof parsed.aiReading === "string"
      ? parsed.aiReading.trim().slice(0, 30_000)
      : "";
    if (!aiReading) {
      throw new HttpError(400, "AI_READING_REQUIRED", "AI reading is required");
    }
    const result = await getRuntimeEnv().DB.prepare(
      `UPDATE readings SET ai_reading = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    )
      .bind(aiReading, Date.now(), id.slice(0, 64), user.id)
      .run();
    if (!result.meta.changes) {
      throw new HttpError(404, "READING_NOT_FOUND", "Reading not found");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    if (!isSameOrigin(request)) {
      throw new HttpError(403, "ORIGIN_REJECTED", "Request origin was rejected");
    }
    const user = await requireUser();
    const { id } = await context.params;
    const result = await getRuntimeEnv().DB.prepare(
      "DELETE FROM readings WHERE id = ? AND user_id = ?",
    )
      .bind(id.slice(0, 64), user.id)
      .run();
    if (!result.meta.changes) {
      throw new HttpError(404, "READING_NOT_FOUND", "Reading not found");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

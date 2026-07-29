import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/admin-audit";
import { apiError } from "@/lib/api-response";
import { HttpError, isSameOrigin, requireAdmin } from "@/lib/auth";
import { getRuntimeEnv } from "@/lib/runtime-env";
import { readingRowToJson, type ReadingRow } from "@/lib/saved-readings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const row = await getRuntimeEnv().DB.prepare(
      `SELECT r.*, u.email AS user_email
       FROM readings r JOIN users u ON u.id = r.user_id
       WHERE r.id = ? LIMIT 1`,
    )
      .bind(id.slice(0, 64))
      .first<ReadingRow>();
    if (!row) throw new HttpError(404, "READING_NOT_FOUND", "Reading not found");
    return NextResponse.json({ reading: readingRowToJson(row) });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request, context: RouteContext) {
  try {
    if (!isSameOrigin(request)) {
      throw new HttpError(403, "ORIGIN_REJECTED", "Request origin was rejected");
    }
    const admin = await requireAdmin();
    const { id } = await context.params;
    const targetId = id.slice(0, 64);
    const result = await getRuntimeEnv().DB.prepare("DELETE FROM readings WHERE id = ?")
      .bind(targetId)
      .run();
    if (!result.meta.changes) {
      throw new HttpError(404, "READING_NOT_FOUND", "Reading not found");
    }
    await writeAuditLog(admin.id, "reading.deleted", "reading", targetId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

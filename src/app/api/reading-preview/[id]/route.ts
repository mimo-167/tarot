import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { HttpError, requireUser } from "@/lib/auth";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };
type PreviewRow = { full_reading: string };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const env = getRuntimeEnv();
    const row = await env.DB.prepare(
      `SELECT full_reading FROM ai_previews
       WHERE id = ? AND user_id = ? AND expires_at > ? LIMIT 1`,
    )
      .bind(id.slice(0, 64), user.id, Date.now())
      .first<PreviewRow>();
    if (!row) {
      throw new HttpError(404, "PREVIEW_NOT_FOUND", "This reading preview is no longer available");
    }
    await env.DB.prepare("UPDATE ai_previews SET unlocked_at = ? WHERE id = ?")
      .bind(Date.now(), id.slice(0, 64))
      .run();
    return NextResponse.json({ reading: row.full_reading });
  } catch (error) {
    return apiError(error);
  }
}

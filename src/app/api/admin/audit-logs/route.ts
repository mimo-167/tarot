import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata_json: string | null;
  created_at: number;
};

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const page = Math.max(1, Number(new URL(request.url).searchParams.get("page")) || 1);
    const pageSize = 30;
    const offset = (page - 1) * pageSize;
    const env = getRuntimeEnv();
    const [countResult, rowsResult] = await env.DB.batch([
      env.DB.prepare("SELECT COUNT(*) AS total FROM audit_logs"),
      env.DB.prepare(
        `SELECT a.id, u.email AS admin_email, a.action, a.target_type,
                a.target_id, a.metadata_json, a.created_at
         FROM audit_logs a JOIN users u ON u.id = a.admin_user_id
         ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
      ).bind(pageSize, offset),
    ]);
    const total = Number((countResult.results[0] as { total?: number } | undefined)?.total || 0);
    return NextResponse.json({
      logs: rowsResult.results as AuditRow[],
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

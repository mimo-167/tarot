import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UserAdminRow = {
  id: string;
  email: string;
  role: string;
  locale: string;
  status: string;
  created_at: number;
  last_login_at: number;
  reading_count: number;
};

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const pageSize = 20;
    const offset = (page - 1) * pageSize;
    const search = (params.get("search") || "").trim().slice(0, 120);
    const status = params.get("status");
    const conditions: string[] = [];
    const values: Array<string | number> = [];
    if (search) {
      conditions.push("u.email LIKE ?");
      values.push(`%${search}%`);
    }
    if (status === "active" || status === "suspended") {
      conditions.push("u.status = ?");
      values.push(status);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const env = getRuntimeEnv();
    const [countResult, rowsResult] = await env.DB.batch([
      env.DB.prepare(`SELECT COUNT(*) AS total FROM users u ${where}`).bind(...values),
      env.DB.prepare(
        `SELECT u.id, u.email, u.role, u.locale, u.status, u.created_at,
                u.last_login_at, COUNT(r.id) AS reading_count
         FROM users u
         LEFT JOIN readings r ON r.user_id = u.id
         ${where}
         GROUP BY u.id
         ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      ).bind(...values, pageSize, offset),
    ]);
    const total = Number((countResult.results[0] as { total?: number } | undefined)?.total || 0);
    return NextResponse.json({
      users: rowsResult.results as UserAdminRow[],
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

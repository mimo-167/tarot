import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminReadingRow = {
  id: string;
  user_id: string;
  user_email: string;
  locale: string;
  spread_id: string;
  spread_name: string;
  created_at: number;
  updated_at: number;
  has_ai: number;
};

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const pageSize = 20;
    const offset = (page - 1) * pageSize;
    const search = (params.get("search") || "").trim().slice(0, 120);
    const ai = params.get("ai");
    const conditions: string[] = [];
    const values: Array<string | number> = [];
    if (search) {
      conditions.push("(u.email LIKE ? OR r.spread_name LIKE ?)");
      values.push(`%${search}%`, `%${search}%`);
    }
    if (ai === "yes") conditions.push("r.ai_reading <> ''");
    if (ai === "no") conditions.push("r.ai_reading = ''");
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const env = getRuntimeEnv();
    const [countResult, rowsResult] = await env.DB.batch([
      env.DB.prepare(
        `SELECT COUNT(*) AS total FROM readings r
         JOIN users u ON u.id = r.user_id ${where}`,
      ).bind(...values),
      env.DB.prepare(
        `SELECT r.id, r.user_id, u.email AS user_email, r.locale,
                r.spread_id, r.spread_name, r.created_at, r.updated_at,
                CASE WHEN r.ai_reading <> '' THEN 1 ELSE 0 END AS has_ai
         FROM readings r
         JOIN users u ON u.id = r.user_id
         ${where}
         ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      ).bind(...values, pageSize, offset),
    ]);
    const total = Number((countResult.results[0] as { total?: number } | undefined)?.total || 0);
    return NextResponse.json({
      readings: rowsResult.results as AdminReadingRow[],
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

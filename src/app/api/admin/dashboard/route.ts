import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MetricRow = { value: number };
type TimelineRow = { day: string; registrations: number; readings: number };
type SpreadRow = { spread_id: string; spread_name: string; total: number };
type RecentUserRow = {
  id: string;
  email: string;
  status: string;
  created_at: number;
  last_login_at: number;
};
type RecentReadingRow = {
  id: string;
  user_email: string;
  spread_name: string;
  created_at: number;
  has_ai: number;
};

type QueryResult<T> = { results: T[] };

const metric = (result: QueryResult<MetricRow>) =>
  Number(result.results[0]?.value || 0);

export async function GET() {
  try {
    await requireAdmin();
    const env = getRuntimeEnv();
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = now - 13 * 24 * 60 * 60 * 1000;
    const results = await env.DB.batch([
      env.DB.prepare("SELECT COUNT(*) AS value FROM users"),
      env.DB.prepare("SELECT COUNT(*) AS value FROM users WHERE status = 'active'"),
      env.DB.prepare("SELECT COUNT(*) AS value FROM users WHERE status = 'suspended'"),
      env.DB.prepare("SELECT COUNT(*) AS value FROM users WHERE created_at >= ?").bind(sevenDaysAgo),
      env.DB.prepare("SELECT COUNT(*) AS value FROM readings"),
      env.DB.prepare("SELECT COUNT(*) AS value FROM readings WHERE created_at >= ?").bind(sevenDaysAgo),
      env.DB.prepare("SELECT COUNT(*) AS value FROM readings WHERE ai_reading <> ''"),
      env.DB.prepare(
        `WITH RECURSIVE days(day) AS (
           SELECT date(?, 'unixepoch')
           UNION ALL SELECT date(day, '+1 day') FROM days
           WHERE day < date(?, 'unixepoch')
         ),
         registrations AS (
           SELECT date(created_at / 1000, 'unixepoch') AS day, COUNT(*) AS total
           FROM users WHERE created_at >= ? GROUP BY day
         ),
         reading_counts AS (
           SELECT date(created_at / 1000, 'unixepoch') AS day, COUNT(*) AS total
           FROM readings WHERE created_at >= ? GROUP BY day
         )
         SELECT days.day,
                COALESCE(registrations.total, 0) AS registrations,
                COALESCE(reading_counts.total, 0) AS readings
         FROM days
         LEFT JOIN registrations ON registrations.day = days.day
         LEFT JOIN reading_counts ON reading_counts.day = days.day
         ORDER BY days.day`,
      ).bind(
        Math.floor(fourteenDaysAgo / 1000),
        Math.floor(now / 1000),
        fourteenDaysAgo,
        fourteenDaysAgo,
      ),
      env.DB.prepare(
        `SELECT spread_id, spread_name, COUNT(*) AS total
         FROM readings GROUP BY spread_id, spread_name
         ORDER BY total DESC LIMIT 5`,
      ),
      env.DB.prepare(
        `SELECT id, email, status, created_at, last_login_at
         FROM users ORDER BY created_at DESC LIMIT 5`,
      ),
      env.DB.prepare(
        `SELECT r.id, u.email AS user_email, r.spread_name, r.created_at,
                CASE WHEN r.ai_reading <> '' THEN 1 ELSE 0 END AS has_ai
         FROM readings r JOIN users u ON u.id = r.user_id
         ORDER BY r.created_at DESC LIMIT 5`,
      ),
    ]);

    return NextResponse.json({
      metrics: {
        totalUsers: metric(results[0] as QueryResult<MetricRow>),
        activeUsers: metric(results[1] as QueryResult<MetricRow>),
        suspendedUsers: metric(results[2] as QueryResult<MetricRow>),
        newUsers7d: metric(results[3] as QueryResult<MetricRow>),
        totalReadings: metric(results[4] as QueryResult<MetricRow>),
        readings7d: metric(results[5] as QueryResult<MetricRow>),
        aiSavedReadings: metric(results[6] as QueryResult<MetricRow>),
      },
      timeline: results[7].results as TimelineRow[],
      topSpreads: results[8].results as SpreadRow[],
      recentUsers: results[9].results as RecentUserRow[],
      recentReadings: results[10].results as RecentReadingRow[],
    });
  } catch (error) {
    return apiError(error);
  }
}

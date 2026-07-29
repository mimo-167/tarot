import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/admin-audit";
import { apiError } from "@/lib/api-response";
import {
  HttpError,
  isSameOrigin,
  requireAdmin,
  type UserStatus,
} from "@/lib/auth";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };
type TargetUser = { id: string; email: string; role: string; status: UserStatus };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    if (!isSameOrigin(request)) {
      throw new HttpError(403, "ORIGIN_REJECTED", "Request origin was rejected");
    }
    const admin = await requireAdmin();
    const parsed = await request.json() as Record<string, unknown>;
    if (parsed.status !== "active" && parsed.status !== "suspended") {
      throw new HttpError(400, "INVALID_STATUS", "Invalid account status");
    }
    const { id } = await context.params;
    const env = getRuntimeEnv();
    const target = await env.DB.prepare(
      "SELECT id, email, role, status FROM users WHERE id = ? LIMIT 1",
    )
      .bind(id.slice(0, 64))
      .first<TargetUser>();
    if (!target) throw new HttpError(404, "USER_NOT_FOUND", "User not found");
    if (target.role === "admin" || target.id === admin.id) {
      throw new HttpError(400, "ADMIN_PROTECTED", "The administrator account is protected");
    }
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET status = ?, updated_at = ? WHERE id = ?")
        .bind(parsed.status, Date.now(), target.id),
      ...(parsed.status === "suspended"
        ? [env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(target.id)]
        : []),
    ]);
    await writeAuditLog(admin.id, "user.status_changed", "user", target.id, {
      previousStatus: target.status,
      status: parsed.status,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

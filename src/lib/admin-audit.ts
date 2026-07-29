import "server-only";

import { getRuntimeEnv } from "@/lib/runtime-env";

export async function writeAuditLog(
  adminUserId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>,
) {
  await getRuntimeEnv().DB.prepare(
    `INSERT INTO audit_logs
     (id, admin_user_id, action, target_type, target_id, metadata_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      adminUserId,
      action.slice(0, 80),
      targetType.slice(0, 40),
      targetId.slice(0, 80),
      metadata ? JSON.stringify(metadata) : null,
      Date.now(),
    )
    .run();
}

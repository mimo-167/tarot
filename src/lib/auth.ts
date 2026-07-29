import "server-only";

import { cookies } from "next/headers";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const SESSION_COOKIE = "xingyue_session";
export const GUEST_COOKIE = "xingyue_guest";
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const GUEST_SECONDS = 7 * 24 * 60 * 60;

export type UserRole = "member" | "admin";
export type UserStatus = "active" | "suspended";

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
  locale: "zh-CN" | "en";
  status: UserStatus;
  createdAt: number;
  lastLoginAt: number;
};

type UserSessionRow = {
  id: string;
  email: string;
  role: UserRole;
  locale: "zh-CN" | "en";
  status: UserStatus;
  created_at: number;
  last_login_at: number;
};

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export async function hmacHex(secret: string, value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToHex(new Uint8Array(signature));
}

export async function safeEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual?: (left: ArrayBuffer, right: ArrayBuffer) => boolean;
  };
  if (typeof subtle.timingSafeEqual === "function") {
    return subtle.timingSafeEqual(leftHash, rightHash);
  }
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (
    email.length < 3 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return null;
  }
  return email;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function secureCookie(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return forwardedProto === "https" || new URL(request.url).protocol === "https:";
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = Date.now();
  const row = await getRuntimeEnv().DB.prepare(
    `SELECT u.id, u.email, u.role, u.locale, u.status, u.created_at, u.last_login_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'active'
     LIMIT 1`,
  )
    .bind(tokenHash, now)
    .first<UserSessionRow>();
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    locale: row.locale,
    status: row.status,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "AUTH_REQUIRED", "Authentication required");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new HttpError(403, "ADMIN_REQUIRED", "Administrator access required");
  }
  return user;
}

export async function createSession(request: Request, userId: string) {
  const token = randomToken();
  const tokenHash = await sha256(token);
  const now = Date.now();
  const env = getRuntimeEnv();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now),
    env.DB.prepare(
      `INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(tokenHash, userId, now, now + SESSION_SECONDS * 1000, now),
  ]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: secureCookie(request),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await getRuntimeEnv().DB.prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await sha256(token))
      .run();
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getGuestTokenHash(request: Request, create = true) {
  const cookieStore = await cookies();
  let token = cookieStore.get(GUEST_COOKIE)?.value;
  if (!token && create) {
    token = randomToken();
    cookieStore.set(GUEST_COOKIE, token, {
      httpOnly: true,
      secure: secureCookie(request),
      sameSite: "lax",
      path: "/",
      maxAge: GUEST_SECONDS,
    });
  }
  return token ? sha256(token) : null;
}

export async function migrateGuestPreviews(request: Request, userId: string) {
  const guestHash = await getGuestTokenHash(request, false);
  if (!guestHash) return;
  await getRuntimeEnv().DB.prepare(
    `UPDATE ai_previews SET user_id = ?
     WHERE guest_token_hash = ? AND user_id IS NULL AND expires_at > ?`,
  )
    .bind(userId, guestHash, Date.now())
    .run();
}

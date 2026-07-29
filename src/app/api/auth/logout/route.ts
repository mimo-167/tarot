import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { deleteCurrentSession, HttpError, isSameOrigin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      throw new HttpError(403, "ORIGIN_REJECTED", "Request origin was rejected");
    }
    await deleteCurrentSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

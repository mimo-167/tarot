import { NextResponse } from "next/server";
import { HttpError } from "@/lib/auth";

export function apiError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }
  console.error(JSON.stringify({
    message: "API request failed",
    error: error instanceof Error ? error.message : String(error),
  }));
  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}

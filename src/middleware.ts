import { NextRequest, NextResponse } from "next/server";

const HTTPS_ONLY_HOSTS = new Set(["tarot.zxkpg.uk"]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase();

  if (!host || !HTTPS_ONLY_HOSTS.has(host)) {
    return NextResponse.next();
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isHttp = forwardedProto === "http" || request.nextUrl.protocol === "http:";

  if (!isHttp) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";

  return NextResponse.redirect(url, 308);
}

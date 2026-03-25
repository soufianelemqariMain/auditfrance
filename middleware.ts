import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  if (host.includes("auditfrance.vercel.app")) {
    const url = request.nextUrl.clone();
    url.host = "infoverif.org";
    url.protocol = "https";
    url.port = "";
    return NextResponse.redirect(url, { status: 301 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next|favicon.ico).*)",
};

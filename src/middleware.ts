import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Don't protect auth endpoint
  if (pathname === "/api/admin/auth") {
    return NextResponse.next();
  }

  // For /admin page itself, let it through — the page handles login UI
  if (pathname === "/admin") {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protect /api/admin/* routes (except /api/admin/auth)
  const fromCookie = request.cookies.get("crossy_admin")?.value;
  const fromHeader = request.headers
    .get("authorization")
    ?.replace("Bearer ", "");
  const authenticated = fromCookie === secret || fromHeader === secret;

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

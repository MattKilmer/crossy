import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;

  // No secret configured — block in production, allow in dev
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Check all auth sources
  const fromQuery = request.nextUrl.searchParams.get("secret");
  const fromCookie = request.cookies.get("crossy_admin")?.value;
  const fromHeader = request.headers.get("authorization")?.replace("Bearer ", "");
  const provided = fromQuery ?? fromCookie ?? fromHeader;

  if (provided !== secret) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If authenticated via query param, set cookie and redirect to clean URL
  if (fromQuery === secret) {
    const cleanUrl = new URL(request.nextUrl.pathname, request.url);
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set("crossy_admin", secret, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

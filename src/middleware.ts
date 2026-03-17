import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/api/admin")) {
    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      // No secret configured — block admin entirely in production
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.next();
    }

    // Check query param, cookie, or Authorization header
    const provided =
      request.nextUrl.searchParams.get("secret") ??
      request.cookies.get("crossy_admin")?.value ??
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (provided !== secret) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // For page routes, redirect to homepage
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Set cookie so subsequent requests don't need ?secret param
    const response = NextResponse.next();
    if (request.nextUrl.searchParams.get("secret") && !request.cookies.get("crossy_admin")) {
      response.cookies.set("crossy_admin", secret, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

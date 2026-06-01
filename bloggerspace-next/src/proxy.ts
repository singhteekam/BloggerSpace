import { NextRequest, NextResponse } from "next/server";

// Maintenance mode is controlled by the MAINTENANCE_MODE environment variable
// (set it to "true" in your hosting/Vercel env to take the public site down).
// This is read at the edge with zero network/DB calls — no more polling the
// backend on every request.
function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === "true";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const inMaintenance = isMaintenanceMode();

  // Admin panel + Next.js internals + API always pass (admins keep full access).
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // The /maintenance page is only reachable WHILE maintenance is on. When the
  // site is live, hitting it directly redirects home (it must not be public).
  if (pathname.startsWith("/maintenance")) {
    return inMaintenance ? NextResponse.next() : NextResponse.redirect(new URL("/", request.url));
  }

  // Everything else is blocked during maintenance.
  if (inMaintenance) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files and images
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

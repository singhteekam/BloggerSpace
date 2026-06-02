import { NextRequest, NextResponse } from "next/server";

// Maintenance mode is controlled by the MAINTENANCE_MODE environment variable
// (set it to "true" in your hosting/Vercel env to take the public site down).
// This is read at the edge with zero network/DB calls — no more polling the
// backend on every request.
function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === "true";
}

// Private / non-content routes that must NOT appear in Google's index: the admin
// + reviewer panels, the logged-in user dashboard, token-gated/transient auth
// flow pages, and the maintenance screen. We emit an X-Robots-Tag header for
// these (works for every route, incl. client pages that can't export `robots`).
//
// Note: /login, /signup and /forgotpassword are INTENTIONALLY left out — they're
// public landing pages worth ranking (brand "login"/"sign up" searches).
const NOINDEX_PREFIXES = [
  "/admin",
  "/reviewer",
  "/bloggerspace",
  "/resetpassword", // needs a reset token in the URL
  "/verify-otp", // transient verification step
  "/reverify", // transient re-verification step
  "/auth-success", // transient OAuth landing/redirect
  "/maintenance",
];

// Indexable exceptions that live UNDER a noindexed prefix (public content pages
// inside the otherwise-private /bloggerspace space).
const INDEX_EXCEPTIONS = ["/bloggerspace/apply-reviewer"];

function shouldNoindex(pathname: string): boolean {
  if (INDEX_EXCEPTIONS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const inMaintenance = isMaintenanceMode();

  // Decide the response (maintenance routing) first, then tag noindex routes.
  let response: NextResponse;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    // Admin panel + Next.js internals + API always pass (admins keep full access).
    response = NextResponse.next();
  } else if (pathname.startsWith("/maintenance")) {
    // Only reachable WHILE maintenance is on; otherwise redirect home.
    response = inMaintenance
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/", request.url));
  } else if (inMaintenance) {
    // Everything else is blocked during maintenance.
    response = NextResponse.redirect(new URL("/maintenance", request.url));
  } else {
    response = NextResponse.next();
  }

  if (shouldNoindex(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  // Run on all routes except static files and images
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

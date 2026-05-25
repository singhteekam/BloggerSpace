import { NextRequest, NextResponse } from "next/server";

// Module-level cache — avoids calling the backend on every single request.
// Refreshes every 30 seconds. Each Edge worker instance has its own cache,
// which is fine — maintenance mode takes effect within ~30 s of being toggled.
let cache: { value: boolean; expiresAt: number } | null = null;

async function isMaintenanceMode(): Promise<boolean> {
  if (cache && Date.now() < cache.expiresAt) return cache.value;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/maintenance`,
      { signal: AbortSignal.timeout(3000) },
    );
    const data = await res.json();
    const value = Boolean(data.maintenanceMode);
    cache = { value, expiresAt: Date.now() + 30_000 };
    return value;
  } catch {
    // Backend unreachable — fail open (don't block the site)
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow admin panel, the maintenance page itself, and Next.js internals
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const inMaintenance = await isMaintenanceMode();
  if (inMaintenance) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files and images
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

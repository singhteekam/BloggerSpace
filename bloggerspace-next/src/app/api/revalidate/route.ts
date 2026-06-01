import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// On-demand ISR revalidation, called by the backend whenever content that lives
// on a cached page changes (publish, edit, discard, delete, profile update,
// review approval). Purges the affected pages so the next request from any user
// gets fresh data — instead of waiting for the 24h background revalidate.
// Secured by a shared secret so only our backend can trigger it.
export async function POST(req: Request) {
  const secret = req.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  let body: { slug?: string; username?: string; paths?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }

  const revalidated: string[] = [];
  const purge = (p: string) => {
    revalidatePath(p);
    revalidated.push(p);
  };

  if (body.slug) purge(`/blogs/${body.slug}`);
  if (body.username) purge(`/user/${body.username}`);
  if (Array.isArray(body.paths)) {
    // Callers pass exactly what's affected (e.g. "/" only when a count/listing
    // actually changes), so profile/follow actions don't needlessly churn home.
    for (const p of body.paths) {
      if (typeof p === "string" && p.startsWith("/")) purge(p);
    }
  }

  return NextResponse.json({ revalidated, now: Date.now() });
}

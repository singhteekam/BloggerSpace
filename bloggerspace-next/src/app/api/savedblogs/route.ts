import { type NextRequest, NextResponse } from "next/server";

// const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

// Proxy for PATCH /api/users/addtosavedblogs
// The server's CORS allowedMethods doesn't include PATCH, so browser requests
// would be blocked. This server-side route forwards the request without CORS.
export async function POST(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ message: "userId required" }, { status: 400 });
  }

  const body = await req.json();

  const upstream = await fetch(
    `${BACKEND}/api/users/addtosavedblogs?userId=${userId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

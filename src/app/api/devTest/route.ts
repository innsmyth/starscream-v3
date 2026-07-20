import { NextRequest, NextResponse } from "next/server";

// GET /api/devTest?seconds=10 - enables the dev test plane for the specified number
// of seconds (default 10). Returns the enable-until timestamp.
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const seconds = Math.max(1, parseInt(searchParams.get("seconds") || "10", 10));
    const now = Date.now();
    const until = now + seconds * 1000;

    // Store on globalThis so aircraft route can read it
    (globalThis as any).__devTestEnabledUntil = until;

    return NextResponse.json({ enabledUntil: until, seconds });
  } catch (err) {
    return NextResponse.json({ error: "Failed to enable dev test plane" }, { status: 500 });
  }
}

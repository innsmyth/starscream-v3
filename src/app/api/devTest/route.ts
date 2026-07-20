import { NextRequest, NextResponse } from "next/server";
import * as testMode from "../../../lib/testMode";

// GET /api/devTest?seconds=10 - enables the dev test plane for the specified number
// of seconds (default 10). Returns the enable-until timestamp.
export async function GET(request: NextRequest) {
  try {
    // Only allow this endpoint when running in explicit test mode
    if (((process.env.NEXT_PUBLIC_APP_MODE || "").toLowerCase() !== "test")) {
      return NextResponse.json({ error: "devTest endpoint only available in test mode" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const seconds = Math.max(1, parseInt(searchParams.get("seconds") || "10", 10));
    const type = (searchParams.get("type") || "plane").toLowerCase();

    if (type === "satellite" || type === "sat" || type === "starship") {
      const until = testMode.enableTestSatellite(seconds);
      return NextResponse.json({ type: "satellite", enabledUntil: until, seconds });
    }

    const until = testMode.enableTestPlane(seconds);

    return NextResponse.json({ type: "plane", enabledUntil: until, seconds });
  } catch (err) {
    return NextResponse.json({ error: "Failed to enable dev test plane" }, { status: 500 });
  }
}

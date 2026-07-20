import { NextResponse } from "next/server";
export const revalidate = 0;
const API_URL = process.env.LOCAL_ADSB_URL || "";

// Module-level timestamp marking when the dev test plane became available at server start.
// We still track the server-start time as a fallback, but a dedicated API can set
// a global enable-until timestamp to trigger the test plane on demand.
let devTestStart: number | null = Date.now();

// Expose a well-known global flag so other API routes can enable the dev test plane
// for a short duration. Stored as a numeric timestamp (ms since epoch) on globalThis.
;(globalThis as any).__devTestEnabledUntil = (globalThis as any).__devTestEnabledUntil || null;

export async function GET() {
  try {
    // Only allow the test plane in explicit "test" mode. Do not show in normal
    // development. Test mode is opt-in via NEXT_PUBLIC_APP_MODE=test.
    if (process.env.NODE_ENV !== "production" && (process.env.NEXT_PUBLIC_APP_MODE || "").toLowerCase() === "test") {
      const now = Date.now();
      const CENTER_LAT = parseFloat(process.env.NEXT_PUBLIC_CENTER_LAT || "51.47674088740635");
      const CENTER_LON = parseFloat(process.env.NEXT_PUBLIC_CENTER_LON || "-0.23339838187103154");
      const testPlane = {
        flight: "TEST123",
        lat: CENTER_LAT + 0.0001,
        lon: CENTER_LON + 0.0001,
        alt: 10000,
        track: 180,
        squawk: "7000",
        icao24: "abc123",
        seen: now,
      };

      // Environment toggle to force the test plane on while developing or testing.
      // If the environment toggle is set (npm run test), allow the test plane
      // but only for a short window (10s) after the server first observes the
      // toggle. This prevents a persistent env var from showing the plane
      // indefinitely.
      const envForce = (process.env.NEXT_PUBLIC_ENABLE_TEST_PLANE || "").toLowerCase();
      if (envForce === "1" || envForce === "true") {
        // Track when the env toggle was first observed in this server process.
        if (!(globalThis as any).__devEnvStart) {
          (globalThis as any).__devEnvStart = now;
        }
        const devEnvStart = (globalThis as any).__devEnvStart as number;
        if (now - devEnvStart <= 10000) {
          return NextResponse.json({ aircraft: [testPlane] });
        }
        // fall through if env toggle window expired
      }

      const enabledUntil = (globalThis as any).__devTestEnabledUntil as number | null;
      const serverStartEnabled = devTestStart !== null && now - devTestStart <= 10000;
      const isEnabled = (enabledUntil && now <= enabledUntil) || serverStartEnabled;

      if (isEnabled) {
        return NextResponse.json({ aircraft: [testPlane] });
      }

      // When not enabled return an empty aircraft list so the UI won't show the test plane
      return NextResponse.json({ aircraft: [] });
    }

    // Fetch data from the external API in production
    const response = await fetch(API_URL);

    // Handle unsuccessful requests
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch aircraft data" },
        { status: response.status }
      );
    }

    // Parse the JSON data from the response
    const data = await response.json();

    // Return the data as a JSON response
    return NextResponse.json(data);
  } catch (error) {
    // Handle any errors that occur during the fetch
    return NextResponse.json(
      { error: "An error occurred while fetching data" },
      { status: 500 }
    );
  }
}

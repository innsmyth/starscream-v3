import { NextResponse } from "next/server";
export const revalidate = 0;
const API_URL = process.env.LOCAL_ADSB_URL || "";

// Module-level timestamp marking when the dev test plane became available.
// This will be used to limit the test plane to a 10 second window after server start.
let devTestStart: number | null = Date.now();

export async function GET() {
  try {
    // In development return a deterministic test plane for the first 10 seconds
    if (process.env.NODE_ENV !== "production") {
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

      if (devTestStart === null) devTestStart = now;
      // Only return the test plane for the first 10 seconds after devTestStart
      if (now - devTestStart <= 10000) {
        return NextResponse.json({ aircraft: [testPlane] });
      }

      // After 10s return an empty aircraft list so the UI no longer shows the test plane
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

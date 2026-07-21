/*
 Aircraft API Route
 Returns nearby aircraft. In test mode returns a deterministic test plane when
 explicitly enabled via the devTest endpoint; otherwise proxies the production
 data source configured by LOCAL_ADSB_URL.
*/
import { NextResponse } from "next/server";
import * as testMode from "../../../lib/testMode";

export const revalidate = 0;

const API_URL = process.env.LOCAL_ADSB_URL || "";

export async function GET() {
  try {
    // If running in test mode return the test plane (when enabled) or an empty list
    const isTest = testMode.isTestMode();
    if (isTest) {
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

      return NextResponse.json({ aircraft: testMode.isTestPlaneEnabled() ? [testPlane] : [] });
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

    // Return the fetched data as JSON
    return NextResponse.json(await response.json());
  } catch (error) {
    // Handle any errors that occur during the fetch
    return NextResponse.json(
      { error: "An error occurred while fetching data" },
      { status: 500 }
    );
  }
}

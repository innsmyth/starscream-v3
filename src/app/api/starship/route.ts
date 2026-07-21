/*
 Starship (Satellite) API Route
 Returns nearby satellites. In test mode returns a deterministic mock
 satellite when enabled via the devTest endpoint; otherwise proxies the
 configured external N2YO API.
*/

import { NextResponse } from "next/server";
import * as testMode from "../../../lib/testMode";

export const revalidate = 0;

const BASE_URL = process.env.NEXT_PUBLIC_ORBIT_DETAILS_URL || "";
const CENTER_LAT = process.env.NEXT_PUBLIC_CENTER_LAT || "";
const CENTER_LON = process.env.NEXT_PUBLIC_CENTER_LON || "";
const CENTER_ALT = process.env.NEXT_PUBLIC_CENTER_ALT || "";
const RADIUS_KM = process.env.NEXT_PUBLIC_RADIUS_KM || "";
const API_KEY = process.env.API_KEY_N2YO || "";

export async function GET() {
  try {
    // In test mode return mock satellite when enabled, otherwise fetch external data
    const isTest = process.env.NODE_ENV !== "production" && testMode.isTestMode();

    if (isTest && testMode.isTestSatelliteEnabled()) {
      const lat = parseFloat(process.env.NEXT_PUBLIC_CENTER_LAT || "51.47674088740635");
      const lon = parseFloat(process.env.NEXT_PUBLIC_CENTER_LON || "-0.23339838187103154");

      return NextResponse.json({
        above: [
          {
            satid: 99999,
            satname: "TEST_SAT",
            intDesignator: "TEST-1",
            launchDate: new Date().toISOString(),
            satalt: 400,
            satlat: lat + 0.0001,
            satlng: lon + 0.0001,
          },
        ],
      });
    }

    const API_URL = `${BASE_URL}${CENTER_LAT}/${CENTER_LON}/${CENTER_ALT}/${RADIUS_KM}/0/&apiKey=${API_KEY}`;

    const response = await fetch(API_URL);

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch starship data" }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    // Handle any errors that occur during the fetch
    return NextResponse.json(
      { error: "An error occurred while fetching data" },
      { status: 500 }
    );
  }
}

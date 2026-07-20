import { NextResponse } from "next/server";
export const revalidate = 0;
const API_URL = process.env.LOCAL_ADSB_URL || "";

export async function GET() {
  try {
    // In development return a deterministic test plane so the UI shows it
    if (process.env.NODE_ENV !== "production") {
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
        seen: Date.now(),
      };
      return NextResponse.json({ aircraft: [testPlane] });
    }

    // Fetch data from the external API
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

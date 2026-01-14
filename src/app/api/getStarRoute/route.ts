import { NextRequest, NextResponse } from "next/server";

const ORBIT_DETAILS_URL = process.env.NEXT_PUBLIC_ORBIT_DETAILS_URL || "";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Extract the callsign from the query parameters
  const callsign = searchParams.get("callsign");
  if (!callsign) {
    return NextResponse.json(
      { error: "No callsign provided" },
      { status: 400 }
    );
  }

  try {
    // Fetch data from the external API
    const orbitDetails = await fetch(`${ORBIT_DETAILS_URL}${callsign}`);

    // Handle unsuccessful requests
    if (!orbitDetails.ok) {
      return NextResponse.json(
        { error: "Failed to fetch orbit details" },
        { status: orbitDetails.status }
      );
    }

    // Parse the JSON data from the response
    const orbitInfo = await orbitDetails.json();

    // Return the data as a JSON response
    return NextResponse.json(orbitInfo);
  } catch (error) {
    console.error("Error fetching orbit details:", error); // Log the error for debugging
    return NextResponse.json(
      { error: "An error occurred while fetching orbit data" },
      { status: 500 }
    );
  }
}

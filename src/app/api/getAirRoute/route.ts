import { NextRequest, NextResponse } from "next/server";

const FLIGHT_DETAILS_URL = process.env.NEXT_PUBLIC_FLIGHT_DETAILS_URL || "";

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
    // Only return a mock flight route when running in explicit test mode.
    if (process.env.NODE_ENV !== "production" && (process.env.NEXT_PUBLIC_APP_MODE || "").toLowerCase() === "test") {
      const mock = {
        response: {
          flightroute: {
            origin: {
              municipality: "Test Origin",
              iata_code: (process.env.NEXT_PUBLIC_LOCAL_AIRPORT_CODES || "").split(",")[0] || "TST",
            },
            destination: {
              municipality: "Test Destination",
              iata_code: "DST",
            },
          },
        },
      };

      return NextResponse.json(mock);
    }
    // Fetch data from the external API
    const flightDetails = await fetch(`${FLIGHT_DETAILS_URL}${callsign}`);

    // Handle unsuccessful requests
    if (!flightDetails.ok) {
      return NextResponse.json(
        { error: "Failed to fetch flight details" },
        { status: flightDetails.status }
      );
    }

    // Parse the JSON data from the response
    const flightInfo = await flightDetails.json();

    // Return the data as a JSON response
    return NextResponse.json(flightInfo);
  } catch (error) {
    console.error("Error fetching flight details:", error); // Log the error for debugging
    return NextResponse.json(
      { error: "An error occurred while fetching flight data" },
      { status: 500 }
    );
  }
}

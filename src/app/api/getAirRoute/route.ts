import { NextRequest, NextResponse } from "next/server";
import * as testMode from "../../../lib/testMode";

const FLIGHT_DETAILS_URL = process.env.NEXT_PUBLIC_FLIGHT_DETAILS_URL || "";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Extract the callsign from the query parameters
  const callsign = searchParams.get("callsign");
  if (!callsign) {
    return NextResponse.json({ error: "No callsign provided" }, { status: 400 });
  }

  try {
    // Return mock flight route in test mode, otherwise fetch from external API
    if (process.env.NODE_ENV !== "production" && testMode.isTestMode()) {
      const mock = {
        response: {
          flightroute: {
            origin: {
              municipality: "Test Origin",
              iata_code:
                (process.env.NEXT_PUBLIC_LOCAL_AIRPORT_CODES || "").split(",")[0] ||
                "TST",
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

    const flightDetails = await fetch(`${FLIGHT_DETAILS_URL}${callsign}`);

    if (!flightDetails.ok)
      return NextResponse.json(
        { error: "Failed to fetch flight details" },
        { status: flightDetails.status }
      );

    return NextResponse.json(await flightDetails.json());
  } catch (error) {
    console.error("Error fetching flight details:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching flight data" },
      { status: 500 }
    );
  }
}

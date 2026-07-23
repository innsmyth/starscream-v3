/*
  Main Page
  Displays plane or satellite test overlays and a slide panel with details.
  Polls backend endpoints for aircraft and starship data and renders animations.
*/

"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import SlideHolder from "./components/SlideHolder";
import { PlaneAnimation } from "./components/PlaneAnimation";
import { SatelliteAnimation } from "./components/SatelliteAnimation";
import TestToggle from "./components/TestToggle";
import { haversineDistance } from "./lib/haversine";

// Use sensible defaults when NEXT_PUBLIC_* env vars aren't provided so the dev UI works
const CENTER_LAT = parseFloat(process.env.NEXT_PUBLIC_CENTER_LAT || "51.47674088740635");
const CENTER_LON = parseFloat(process.env.NEXT_PUBLIC_CENTER_LON || "-0.23339838187103154");
const RADIUS_KM = parseFloat(process.env.NEXT_PUBLIC_RADIUS_KM || "2");
const LOCAL_AIRPORT_LIST = (process.env.NEXT_PUBLIC_LOCAL_AIRPORT_CODES || "").split(",");

export default function Home() {
  const [statePlaneData, setStatePlaneData] = useState<any>(null);
  const [stateSatelliteData, setStateSatelliteData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const currentCallsign = useRef<string>("");
  const currentSatellite = useRef<any>(null);
  const splideRef = useRef<any>(null);

  // Code to determine if we use the origin or destination:
  let planeData = statePlaneData?.origin || {}
  planeData.whichOne = "Origin"
  if (LOCAL_AIRPORT_LIST.includes(statePlaneData?.origin?.iata_code)) {
    planeData = statePlaneData?.destination
    planeData.whichOne = "Destination"
  }

  const planeSlide = [
    {
      title: `${planeData.whichOne} City`,
      stat: planeData?.municipality,
      width: "w-7/12",
    },
    {
      title: "Airport Code",
      stat: planeData?.iata_code,
      width: "w-5/12",
    },
  ];

    const satelliteSlide = [
    {
      title: stateSatelliteData?.satname,
      stat: stateSatelliteData?.intDesignator,
      width: "w-7/12",
    },
    {
      title: "Altitude",
      stat: stateSatelliteData?.satalt,
      width: "w-5/12",
    },
  ];

  const slides = [
    {
      title: "Current Time",
      stat: currentTime,
      width: "w-full",
    },
  ];

  const getPlanesAround = useCallback(async () => {
    try {
      const planesAround = await fetch("/api/aircraft");
      const response = await planesAround.json();

      const planeDistances = response.aircraft
        .map((plane: any) => {
          if (!plane.flight || !plane.lat || !plane.lon) {
            return null;
          }
          const distance = haversineDistance(
            CENTER_LAT,
            CENTER_LON,
            plane.lat,
            plane.lon
          );
          if (distance > RADIUS_KM) {
            return null;
          }
          return { ...plane, distance };
        })
        .filter((plane: any) => plane !== null);

      if (planeDistances.length === 0) {
        setStatePlaneData(null);
        // clear current callsign so a re-enabled test plane will trigger fetch
        currentCallsign.current = "";
        return false;
      }

      try {
        const nearestPlaneCallsign = planeDistances[0]?.flight.trim();
        // If we already have this callsign and the UI is populated, skip refetch.
        if (currentCallsign.current === nearestPlaneCallsign && statePlaneData) {
          return true;
        }
        const flightDetails = await fetch(
          `/api/getAirRoute?callsign=${nearestPlaneCallsign}`
        );
        const flightInfo = await flightDetails.json();

        if (flightDetails.ok) {
          const flightRoute = flightInfo.response.flightroute;
          console.log("Flight route:", flightRoute);
          setStatePlaneData(flightRoute);
          // Record the callsign after successfully setting UI state so follow-up
          // calls don't skip fetching when state hasn't been populated yet.
          currentCallsign.current = nearestPlaneCallsign;
          return true;
        } else {
          console.error("Error fetching flight details:", flightInfo.error);
          return false;
        }
      } catch (error) {
        console.error("Failed to fetch aircraft data", error);
      }
    } catch (error) {
      console.error("Failed to fetch aircraft data", error);
      return false;
    }
  }, []);

  const getSatellitesAround = useCallback(async () => {
    try {
      const satellitesAround = await fetch("/api/starship");
      const response = await satellitesAround.json();

      const satelliteData = response.above
        .map((satellite: any) => {
          if (!satellite.satid || !satellite.satname || !satellite.intDesignator || !satellite.launchDate || !satellite.satalt || !satellite.satlat || !satellite.satlng) {
            return null;
          }
          const distance = haversineDistance(
            CENTER_LAT,
            CENTER_LON,
            satellite.satlat,
            satellite.satlng
          );
          if (distance > RADIUS_KM) {
            return null;
          }
          return { ...satellite, distance };
        })
        .filter((satellite: any) => satellite !== null);

      if (satelliteData.length === 0) {
        setStateSatelliteData(null);
        currentSatellite.current = null;
        return false;
      }

      try {
        const nearestSatellite = satelliteData[0];
        if (currentSatellite.current === nearestSatellite) {
          return;
        }
        currentSatellite.current = nearestSatellite;
        
        if (satellitesAround.ok) {
          setStateSatelliteData(nearestSatellite);
        } else {
          console.error("Error fetching nearest satellite details:", response.error);
        }
        return true;
      } catch (error) {
        console.error("Failed to fetch starship data", error);
      }
    } catch (error) {
      console.error("Failed to fetch starship data", error);
      return false;
    }
  }, []);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    getPlanesAround();
    // Fetch aircraft data every 10 seconds
    const planeInterval = setInterval(() => {
      getPlanesAround();
    }, 10000);
    return () => clearInterval(planeInterval);
  }, [getPlanesAround]);

  // Listen for a test-plane-enabled event (dispatched by TestToggle) and fetch immediately
  useEffect(() => {
    // When testPlaneEnabled fires fetch immediately and schedule clear based on server enabledUntil
    let refreshTimer: number | null = null;
    let pollTimer: number | null = null;
    let clearStateTimer: number | null = null;
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent)?.detail || {};
        const enabledUntil = detail.enabledUntil;
        const seconds = detail.seconds || 10;
        console.debug("testPlaneEnabled: scheduling fetch/poll, seconds=", seconds, "at", new Date().toLocaleTimeString());
        getPlanesAround();
        if (refreshTimer) window.clearTimeout(refreshTimer);
        try {
          // Always base client timers on the server-returned duration (seconds)
          // rather than the absolute enabledUntil timestamp. This avoids
          // premature clears when the client clock is ahead of the server.
          const msRemaining = Math.max(0, (seconds || 10) * 1000);
          console.debug("testPlaneEnabled: scheduling based on seconds, msRemaining=", msRemaining, "enabledUntil=", enabledUntil);
          refreshTimer = window.setTimeout(() => { getPlanesAround(); refreshTimer = null; }, msRemaining + 200) as unknown as number;
          if (clearStateTimer) window.clearTimeout(clearStateTimer);
          // At the scheduled expiry, double-check the backend before clearing UI state.
          // This avoids clearing when the server still reports the test plane due to
          // timing or propagation delays.
          clearStateTimer = window.setTimeout(() => {
            (async () => {
              console.debug("testPlaneEnabled: expiry reached, re-checking planes at", new Date().toLocaleTimeString());
              try {
                const still = await getPlanesAround();
                if (!still) {
                  console.debug("testPlaneEnabled: no plane found on re-check, clearing UI");
                  setStatePlaneData(null);
                  currentCallsign.current = "";
                } else {
                  console.debug("testPlaneEnabled: plane still present on re-check, leaving UI intact");
                }
              } catch (e) {
                console.debug("testPlaneEnabled: re-check failed, clearing UI as fallback", e);
                setStatePlaneData(null);
                currentCallsign.current = "";
              }
              clearStateTimer = null;
            })();
          }, msRemaining + 500) as unknown as number;
        } catch (e) {
          // ignore
        }

        // Poll as a fallback until the plane disappears
        let elapsed = 0;
        const pollInterval = 1000;
        const maxMs = (seconds + 5) * 1000;
        if (pollTimer) window.clearInterval(pollTimer);
        pollTimer = window.setInterval(async () => {
          try {
            elapsed += pollInterval;
            const found = await getPlanesAround();
            if (!found || elapsed >= maxMs) {
              if (pollTimer) window.clearInterval(pollTimer);
              pollTimer = null;
            }
          } catch (e) {
            if (pollTimer) window.clearInterval(pollTimer);
            pollTimer = null;
          }
        }, pollInterval) as unknown as number;
      } catch (e) {
        console.error("Error handling testPlaneEnabled event", e);
      }
    };
    window.addEventListener("testPlaneEnabled", handler as EventListener);
    return () => {
      window.removeEventListener("testPlaneEnabled", handler as EventListener);
      if (refreshTimer) window.clearTimeout(refreshTimer);
      if (pollTimer) window.clearInterval(pollTimer as any);
      if (clearStateTimer) window.clearTimeout(clearStateTimer);
    };
  }, [getPlanesAround]);

  // Listen for test-satellite-enabled event and fetch satellites immediately
  useEffect(() => {
    let refreshTimer: number | null = null;
    let pollTimer: number | null = null;
    let clearStateTimer: number | null = null;
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent)?.detail || {};
        const seconds = detail.seconds || 10;
        // Fire an immediate fetch to show the test satellite
        console.debug("testSatelliteEnabled: scheduling fetch/poll, seconds=", seconds, "at", new Date().toLocaleTimeString());
        getSatellitesAround();
        if (refreshTimer) window.clearTimeout(refreshTimer);
        // Schedule a single re-check after the nominal window (seconds)
        try {
          const msRemaining = Math.max(0, (seconds || 10) * 1000);
          refreshTimer = window.setTimeout(() => { getSatellitesAround(); refreshTimer = null; }, msRemaining + 200) as unknown as number;
          // Also schedule a guaranteed client-side clear of UI state as a fallback
          if (clearStateTimer) window.clearTimeout(clearStateTimer);
          clearStateTimer = window.setTimeout(() => {
            console.debug("testSatelliteEnabled: clearing satellite UI fallback at", new Date().toLocaleTimeString());
            setStateSatelliteData(null);
            currentSatellite.current = null;
            clearStateTimer = null;
          }, msRemaining + 500) as unknown as number;
        } catch (e) {
          // ignore
        }
        // As a fallback, poll every 1s for up to (seconds + 5) seconds to confirm the satellite disappears
        let elapsed = 0;
        const pollInterval = 1000;
        const maxMs = (seconds + 5) * 1000;
        if (pollTimer) window.clearInterval(pollTimer);
        pollTimer = window.setInterval(async () => {
          try {
            elapsed += pollInterval;
            const found = await getSatellitesAround();
            if (!found || elapsed >= maxMs) {
              if (pollTimer) window.clearInterval(pollTimer);
              pollTimer = null;
            }
          } catch (e) {
            if (pollTimer) window.clearInterval(pollTimer);
            pollTimer = null;
          }
        }, pollInterval) as unknown as number;
      } catch (e) {
        console.error("Error handling testSatelliteEnabled event", e);
      }
    };
    window.addEventListener("testSatelliteEnabled", handler as EventListener);
    return () => {
      window.removeEventListener("testSatelliteEnabled", handler as EventListener);
      if (refreshTimer) window.clearTimeout(refreshTimer);
      if (pollTimer) window.clearInterval(pollTimer as any);
      if (clearStateTimer) window.clearTimeout(clearStateTimer);
    };
  }, [getSatellitesAround]);

  useEffect(() => {
    getSatellitesAround();
    // Fetch satellite data every 10 seconds
    const satelliteInterval = setInterval(() => {
      getSatellitesAround();
    }, 10000);
    return () => clearInterval(satelliteInterval);
  }, [getSatellitesAround]);

  return (
    <div className="min-h-screen w-full bg-black">
      <TestToggle />

      {/* Main container: grid in the center with animations overlaying it */}
      <div className="relative flex items-center justify-center w-full py-12">
        {/* Grid: 3x3 using Tailwind CSS grid utilities */}
        <div className="grid grid-cols-3 grid-rows-3 gap-4 w-full max-w-4xl px-4">
          {/* Row 1 */}
          <div className="bg-transparent border border-gray-700 h-40" />
          <div className="bg-transparent border border-gray-700 h-40" />
          <div className="bg-transparent border border-gray-700 h-40" />

          {/* Row 2 */}
          <div className="bg-transparent border border-gray-700 h-40" />
          {/* Center cell: current clock */}
          <div className="bg-transparent border border-gray-600 h-40 flex items-center justify-center text-white text-3xl font-mono">
            {currentTime}
          </div>
          <div className="bg-transparent border border-gray-700 h-40" />

          {/* Row 3 */}
          <div className="bg-transparent border border-gray-700 h-40" />
          <div className="bg-transparent border border-gray-700 h-40" />
          <div className="bg-transparent border border-gray-700 h-40" />
        </div>

        {/* Animations overlay the grid when active; components use absolute positioning */}
        {(statePlaneData && <PlaneAnimation />) || (stateSatelliteData && <SatelliteAnimation />)}
      </div>

      {/* Slide holder remains visible — position it at the bottom center */}
      <div className="w-full flex justify-center pb-8">
        <SlideHolder
          slides={statePlaneData ? planeSlide : (stateSatelliteData ? satelliteSlide : slides)}
          splideRef={splideRef}
        />
      </div>
    </div>
  );
}

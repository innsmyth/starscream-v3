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
        if (currentCallsign.current === nearestPlaneCallsign) {
          return true;
        }
        currentCallsign.current = nearestPlaneCallsign;
        const flightDetails = await fetch(
          `/api/getAirRoute?callsign=${nearestPlaneCallsign}`
        );
        const flightInfo = await flightDetails.json();

        if (flightDetails.ok) {
          const flightRoute = flightInfo.response.flightroute;
          console.log("Flight route:", flightRoute);
          setStatePlaneData(flightRoute);
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
          // Use the server-returned seconds rather than the absolute enabledUntil timestamp
          // to avoid clock-skew causing premature clears. seconds is the duration the
          // server intended the test artifact to be visible starting from when the
          // request was processed, so schedule based on that value.
          const msRemaining = Math.max(0, (seconds || 10) * 1000);
          refreshTimer = window.setTimeout(() => { getPlanesAround(); refreshTimer = null; }, msRemaining + 200) as unknown as number;
          if (clearStateTimer) window.clearTimeout(clearStateTimer);
          clearStateTimer = window.setTimeout(() => {
            console.debug("testPlaneEnabled: clearing plane UI fallback at", new Date().toLocaleTimeString());
            setStatePlaneData(null);
            currentCallsign.current = "";
            clearStateTimer = null;
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
      {(statePlaneData && <PlaneAnimation />) || (stateSatelliteData && <SatelliteAnimation />)}
      <SlideHolder
        slides={statePlaneData ? planeSlide : (stateSatelliteData ? satelliteSlide : slides)}
        splideRef={splideRef}
      />
    </div>
  );
}

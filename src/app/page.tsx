"use client";
import { useEffect, useRef, useState } from "react";
import SlideHolder from "./components/SlideHolder";
import { PlaneAnimation } from "./components/PlaneAnimation";
import { SatelliteAnimation } from "./components/SatelliteAnimation";
import { haversineDistance } from "./lib/haversine";

const CENTER_LAT = parseFloat(process.env.NEXT_PUBLIC_CENTER_LAT || "0");
const CENTER_LON = parseFloat(process.env.NEXT_PUBLIC_CENTER_LON || "0");
const RADIUS_KM = parseFloat(process.env.NEXT_PUBLIC_RADIUS_KM || "0");
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

  const getPlanesAround = async () => {
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
        return;
      }

      try {
        const nearestPlaneCallsign = planeDistances[0]?.flight.trim();
        if (currentCallsign.current === nearestPlaneCallsign) {
          return;
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
        } else {
          console.error("Error fetching flight details:", flightInfo.error);
        }
      } catch (error) {
        console.error("Failed to fetch aircraft data", error);
      }
    } catch (error) {
      console.error("Failed to fetch aircraft data", error);
    }
  };

  const getSatellitesAround = async () => {
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
        return;
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
      } catch (error) {
        console.error("Failed to fetch starship data", error);
      }
    } catch (error) {
      console.error("Failed to fetch starship data", error);
    }
  };

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
  }, []);

  useEffect(() => {
    getSatellitesAround();
    // Fetch aircraft data every 10 seconds
    const satelliteInterval = setInterval(() => {
      getSatellitesAround();
    }, 10000);
    return () => clearInterval(satelliteInterval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-black">
      {statePlaneData && <PlaneAnimation />}
      <SlideHolder
        slides={statePlaneData ? planeSlide : (stateSatelliteData ? satelliteSlide : slides)} //slides
        splideRef={splideRef}
      />
    </div>
  );
}

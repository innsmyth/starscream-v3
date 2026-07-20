"use client";
import { useState, useRef } from "react";

export default function TestToggle() {
  const [status, setStatus] = useState<string>("");
  const isTestMode = (process.env.NEXT_PUBLIC_APP_MODE || "").toLowerCase() === "test";
  const refreshTimer = useRef<number | null>(null);

  if (!isTestMode) return null;

  const enableTest = async () => {
    try {
      setStatus("Enabling test plane...");
      const res = await fetch("/api/devTest?seconds=10");
      const json = await res.json();
      if (res.ok) {
        setStatus(`Enabled until ${new Date(json.enabledUntil).toLocaleTimeString()}`);
        // Notify the app to fetch aircraft immediately
        try {
          window.dispatchEvent(new Event("testPlaneEnabled"));
        } catch (e) {
          // ignore
        }
        // Schedule a refresh when the server-side window expires so the UI hides the plane
        try {
          if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
          const seconds = json.seconds || 10;
          refreshTimer.current = window.setTimeout(() => {
            try { window.dispatchEvent(new Event("testPlaneEnabled")); } catch (e) {}
          }, seconds * 1000 + 500) as unknown as number;
        } catch (e) {
          // ignore
        }
      } else {
        setStatus(`Error: ${json.error || res.status}`);
      }
    } catch (err) {
      setStatus(`Request failed: ${err}`);
    }
  };

  const enableTestSatellite = async () => {
    try {
      setStatus("Enabling test satellite...");
      const res = await fetch("/api/devTest?type=satellite&seconds=10");
      const json = await res.json();
      if (res.ok) {
        setStatus(`Enabled satellite until ${new Date(json.enabledUntil).toLocaleTimeString()}`);
        try {
          window.dispatchEvent(new Event("testSatelliteEnabled"));
        } catch (e) {
          // ignore
        }
        // Schedule a refresh when the server-side window expires so the UI hides the satellite
        try {
          if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
          const seconds = json.seconds || 10;
          refreshTimer.current = window.setTimeout(() => {
            try { window.dispatchEvent(new Event("testSatelliteEnabled")); } catch (e) {}
          }, seconds * 1000 + 500) as unknown as number;
        } catch (e) {
          // ignore
        }
      } else {
        setStatus(`Error: ${json.error || res.status}`);
      }
    } catch (err) {
      setStatus(`Request failed: ${err}`);
    }
  };

  return (
    <div style={{ position: "fixed", top: 12, right: 12, zIndex: 60 }}>
      <button
        onClick={enableTest}
        className="bg-blue-600 text-white px-3 py-1 rounded"
      >
        Enable Test Plane (10s)
      </button>
      <div style={{ height: 8 }} />
      <button
        onClick={enableTestSatellite}
        className="bg-green-600 text-white px-3 py-1 rounded mt-2"
      >
        Enable Test Satellite (10s)
      </button>
      {status && <div className="text-white mt-2">{status}</div>}
    </div>
  );
}

/*
 Test Toggle UI
 Renders test buttons visible in test mode. Allows enabling a test plane or
 satellite for a timed window; notifies the page via CustomEvent with details.
*/
"use client";
import { useState } from "react";

export default function TestToggle() {
  const [status, setStatus] = useState<string>("");
  const isTestMode = (process.env.NEXT_PUBLIC_APP_MODE || "").toLowerCase() === "test";
  // No timers here; page.tsx will schedule refresh based on event details

  if (!isTestMode) return null;

  const enableTest = async () => {
    try {
      setStatus("Enabling test plane...");
      const res = await fetch("/api/devTest?type=plane&seconds=10");
      const json = await res.json();
      if (res.ok) {
        setStatus(`Test Plane for ${json.seconds}s`);
        // Notify the app to fetch aircraft immediately and include the server-side enabledUntil
        try {
          window.dispatchEvent(new CustomEvent("testPlaneEnabled", { detail: { enabledUntil: json.enabledUntil, seconds: json.seconds } }));
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
        setStatus(`Test Satellite for ${json.seconds}s`);
        // Notify the app to fetch satellites immediately and include the server-side enabledUntil
        try {
          window.dispatchEvent(new CustomEvent("testSatelliteEnabled", { detail: { enabledUntil: json.enabledUntil, seconds: json.seconds } }));
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
        Test Plane (10s)
      </button>
      <div style={{ height: 8 }} />
      <button
        onClick={enableTestSatellite}
        className="bg-red-600 text-white px-3 py-1 rounded mt-2"
      >
        Test Satellite (10s)
      </button>
      {status && <div className="text-white mt-2">{status}</div>}
    </div>
  );
}


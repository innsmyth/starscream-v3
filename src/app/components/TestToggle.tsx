"use client";
import { useState } from "react";

export default function TestToggle() {
  const [status, setStatus] = useState<string>("");
  const isTestMode = (process.env.NEXT_PUBLIC_APP_MODE || "").toLowerCase() === "test";

  if (!isTestMode) return null;

  const enableTest = async () => {
    try {
      setStatus("Enabling test plane...");
      const res = await fetch("/api/devTest?seconds=10");
      const json = await res.json();
      if (res.ok) {
        setStatus(`Enabled until ${new Date(json.enabledUntil).toLocaleTimeString()}`);
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
      {status && <div className="text-white mt-2">{status}</div>}
    </div>
  );
}

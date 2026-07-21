/*
 Test Mode Utilities
 Centralized module that controls test-mode flags for local development. Exposes
 functions to enable/disable a test plane and test satellite for a timed window.
*/

const ENV_WINDOW_MS = 10000; // 10 seconds

import fs from "fs";
import path from "path";

const STORE_FILE = path.join(process.cwd(), ".dev_test_flags.json");

let enabledUntil: number | null = null;
let envObservedAt: number | null = null;

export const isTestMode = (): boolean => {
  return (process.env.NEXT_PUBLIC_APP_MODE || "").toLowerCase() === "test";
};

export const enableTestPlane = (seconds = 10): number => {
  const until = Date.now() + Math.max(1, seconds) * 1000;
  enabledUntil = until;
  // persist to disk so multiple dev server workers see the same flag
  try {
    const existing = fs.existsSync(STORE_FILE) ? JSON.parse(fs.readFileSync(STORE_FILE, "utf8") || "{}") : {};
    existing.planeUntil = enabledUntil;
    fs.writeFileSync(STORE_FILE, JSON.stringify(existing));
  } catch (e) {
    // ignore file errors in dev
  }
  return until;
};

export const getEnableUntil = (): number | null => enabledUntil;

export const isEnvTogglePresent = (): boolean => {
  const v = (process.env.NEXT_PUBLIC_ENABLE_TEST_PLANE || "").toLowerCase();
  return v === "1" || v === "true";
};

// Test plane is enabled only via enableTestPlane (enabledUntil).
export const isTestPlaneEnabled = (): boolean => {
  if (!isTestMode()) return false;
  const now = Date.now();
  // If in-memory flag present use it, otherwise check persisted file (helps
  // when Next dev spawns multiple worker processes that don't share memory).
  if (enabledUntil !== null) return now <= enabledUntil;
  try {
    if (!fs.existsSync(STORE_FILE)) return false;
    const data = JSON.parse(fs.readFileSync(STORE_FILE, "utf8") || "{}");
    const planeUntil = data?.planeUntil || null;
    return planeUntil !== null && now <= planeUntil;
  } catch (e) {
    return false;
  }
};

export const resetTestFlags = () => {
  enabledUntil = null;
  envObservedAt = null;
};

// Satellite-specific flags
let enabledSatelliteUntil: number | null = null;

export const enableTestSatellite = (seconds = 10): number => {
  const until = Date.now() + Math.max(1, seconds) * 1000;
  enabledSatelliteUntil = until;
  try {
    const existing = fs.existsSync(STORE_FILE) ? JSON.parse(fs.readFileSync(STORE_FILE, "utf8") || "{}") : {};
    existing.satelliteUntil = enabledSatelliteUntil;
    fs.writeFileSync(STORE_FILE, JSON.stringify(existing));
  } catch (e) {
    // ignore
  }
  return until;
};

export const isTestSatelliteEnabled = (): boolean => {
  if (!isTestMode()) return false;
  const now = Date.now();
  if (enabledSatelliteUntil !== null) return now <= enabledSatelliteUntil;
  try {
    if (!fs.existsSync(STORE_FILE)) return false;
    const data = JSON.parse(fs.readFileSync(STORE_FILE, "utf8") || "{}");
    const satUntil = data?.satelliteUntil || null;
    return satUntil !== null && now <= satUntil;
  } catch (e) {
    return false;
  }
};

export const resetSatelliteFlag = () => {
  enabledSatelliteUntil = null;
};

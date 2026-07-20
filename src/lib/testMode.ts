// Centralized test-mode utilities
// Controls whether the app is in test mode and whether the in-memory test plane
// should be shown. Intended for local dev/test only (module-level state).

const ENV_WINDOW_MS = 10000; // 10 seconds

let enabledUntil: number | null = null;
let envObservedAt: number | null = null;

export const isTestMode = (): boolean => {
  return (process.env.NEXT_PUBLIC_APP_MODE || "").toLowerCase() === "test";
};

export const enableTestPlane = (seconds = 10): number => {
  const until = Date.now() + Math.max(1, seconds) * 1000;
  enabledUntil = until;
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
  return enabledUntil !== null && now <= enabledUntil;
};

export const resetTestFlags = () => {
  enabledUntil = null;
  envObservedAt = null;
};

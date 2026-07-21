/*
 Test Suite: testMode utilities
 Verifies enable/expiry behavior for the in-memory test flags used by the
 development endpoints. Intended to be run locally (node).
*/
const assert = require("assert");
const testMode = require("../src/lib/testMode");

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  console.log("Starting testMode tests...");

  // Ensure test mode is active for tests
  process.env.NEXT_PUBLIC_APP_MODE = "test";

  testMode.resetTestFlags();

  assert.strictEqual(testMode.isTestMode(), true, "isTestMode should be true when APP_MODE=test");

  // Initially disabled
  assert.strictEqual(testMode.isTestPlaneEnabled(), false, "Test plane should be disabled initially");

  // Enable for 1 second
  const until = testMode.enableTestPlane(1);
  assert.ok(typeof until === "number", "enableTestPlane should return a timestamp");
  assert.strictEqual(testMode.isTestPlaneEnabled(), true, "Test plane should be enabled immediately after enableTestPlane");

  // Wait for 1.2 seconds and ensure it is disabled
  await sleep(1200);
  assert.strictEqual(testMode.isTestPlaneEnabled(), false, "Test plane should be disabled after window expires");

  console.log("All testMode tests passed.");
  process.exit(0);
})().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

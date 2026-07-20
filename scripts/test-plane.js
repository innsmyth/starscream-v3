// Simple test script that creates a valid 'plane' instance and holds it for 10 seconds.

function createPlane() {
  return {
    flight: "TEST123",
    // initial coords (may be adjusted to be within display radius)
    lat: 51.5,
    lon: -0.12,
    alt: 10000,
    track: 180,
    squawk: "7000",
    icao24: "abc123",
    seen: Date.now(),
  };
}

function isValidPlane(p) {
  if (!p) return false;
  if (typeof p.flight !== "string" || p.flight.trim().length === 0) return false;
  if (typeof p.lat !== "number" || p.lat < -90 || p.lat > 90) return false;
  if (typeof p.lon !== "number" || p.lon < -180 || p.lon > 180) return false;
  if (typeof p.alt !== "number") return false;
  if (typeof p.icao24 !== "string" || p.icao24.trim().length === 0) return false;
  return true;
}

console.log("Creating test plane instance...");
const plane = createPlane();

// Determine center and radius from env or sensible defaults
const CENTER_LAT = parseFloat(process.env.NEXT_PUBLIC_CENTER_LAT || "51.47674088740635");
const CENTER_LON = parseFloat(process.env.NEXT_PUBLIC_CENTER_LON || "-0.23339838187103154");
const RADIUS_KM = parseFloat(process.env.NEXT_PUBLIC_RADIUS_KM || "2");

const toRadians = (deg) => (deg * Math.PI) / 180;
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Ensure plane is within display radius
const distanceToCenter = haversineDistance(CENTER_LAT, CENTER_LON, plane.lat, plane.lon);
console.log(`Distance from center: ${distanceToCenter.toFixed(3)} km (radius ${RADIUS_KM} km)`);
if (distanceToCenter > RADIUS_KM) {
  console.log("Adjusting plane coordinates to be within display radius...");
  // place plane approximately at center with a tiny offset
  plane.lat = CENTER_LAT + 0.0001;
  plane.lon = CENTER_LON + 0.0001;
}

if (!isValidPlane(plane)) {
  console.error("Plane instance is invalid:", plane);
  process.exit(1);
}

console.log("Plane instance is valid. Keeping instance alive for 10 seconds...");
console.log(plane);
const finalDistance = haversineDistance(CENTER_LAT, CENTER_LON, plane.lat, plane.lon);
console.log(`Final distance from center: ${finalDistance.toFixed(3)} km`);

setTimeout(() => {
  console.log("10 seconds elapsed — test complete.");
  process.exit(0);
}, 10000);

/**
 * utils/geo.js
 * Geographic / dispatch helper functions.
 */

/**
 * Haversine distance between two lat/lng points (kilometres).
 */
export function haversine(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const toR  = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR;
  const dLng = (lng2 - lng1) * toR;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns the nearest FREE vehicle to the given coordinates,
 * enriched with a `km` field, or null if none available.
 */
export function nearestFreeVehicle(vehicles, lat, lng) {
  return vehicles
    .filter((v) => v.status === 'slobodan')
    .map((v) => ({ ...v, km: haversine(v.lat, v.lng, lat, lng) }))
    .sort((a, b) => a.km - b.km)[0] || null;
}

/**
 * Nudge a vehicle position slightly to simulate GPS movement.
 * delta controls the maximum offset in degrees (~0.001° ≈ 100 m).
 */
export function randomStep(lat, lng, delta = 0.0007) {
  return {
    lat: lat + (Math.random() - 0.5) * delta,
    lng: lng + (Math.random() - 0.5) * delta,
  };
}

/** Current time as HH:MM string */
export function nowTime() {
  return new Date().toLocaleTimeString('sr-Latn', {
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/**
 * Estimate arrival time in minutes from distance in km.
 * Assumes average city speed ~25 km/h.
 */
export function etaMinutes(km) {
  return Math.max(2, Math.round((km / 25) * 60));
}

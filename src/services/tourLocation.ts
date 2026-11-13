export const TOUR_ARRIVAL_RADIUS_METERS = 35;
export const TOUR_MAX_GPS_ACCURACY_METERS = 50;
export const TOUR_REQUIRED_ARRIVAL_SAMPLES = 3;
export const TOUR_ARRIVAL_DWELL_MS = 8000;
export const TOUR_MAX_FIX_AGE_MS = 10000;

interface Coordinate {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceBetweenCoordinatesMeters(from: Coordinate, to: Coordinate) {
  const latitudeDelta = degreesToRadians(to.latitude - from.latitude);
  const longitudeDelta = degreesToRadians(to.longitude - from.longitude);
  const fromLatitude = degreesToRadians(from.latitude);
  const toLatitude = degreesToRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function isReliableTourArrival(distanceMeters: number, accuracyMeters: number | null) {
  return (
    accuracyMeters !== null &&
    Number.isFinite(accuracyMeters) &&
    accuracyMeters >= 0 &&
    accuracyMeters <= TOUR_MAX_GPS_ACCURACY_METERS &&
    Number.isFinite(distanceMeters) && distanceMeters >= 0 &&
    distanceMeters <= TOUR_ARRIVAL_RADIUS_METERS
  );
}

/** One tracker per target stop; discard it when paused or the target changes. */
export function createArrivalTracker() {
  let lastTimestamp = -Infinity;
  let firstTimestamp: number | null = null;
  let samples = 0;
  return (distance: number, accuracy: number | null, timestamp: number, now = Date.now()) => {
    const fresh = Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= TOUR_MAX_FIX_AGE_MS;
    if (!fresh || !isReliableTourArrival(distance, accuracy)) {
      firstTimestamp = null;
      samples = 0;
      return false;
    }
    // The initial position and watcher may deliver the same cached fix.
    if (timestamp <= lastTimestamp) return false;
    if (timestamp - lastTimestamp > TOUR_MAX_FIX_AGE_MS) {
      firstTimestamp = null;
      samples = 0;
    }
    lastTimestamp = timestamp;
    firstTimestamp ??= timestamp;
    samples += 1;
    return samples >= TOUR_REQUIRED_ARRIVAL_SAMPLES && timestamp - firstTimestamp >= TOUR_ARRIVAL_DWELL_MS;
  };
}

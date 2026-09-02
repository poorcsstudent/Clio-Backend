export const TOUR_ARRIVAL_RADIUS_METERS = 35;
export const TOUR_MAX_GPS_ACCURACY_METERS = 50;
export const TOUR_REQUIRED_ARRIVAL_SAMPLES = 2;

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
    accuracyMeters <= TOUR_MAX_GPS_ACCURACY_METERS &&
    distanceMeters <= TOUR_ARRIVAL_RADIUS_METERS
  );
}

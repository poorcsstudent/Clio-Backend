import { CampusLocation } from "../data/campusLocations";

export function getDistanceInMeters(
  a: Pick<CampusLocation, "latitude" | "longitude">,
  b: Pick<CampusLocation, "latitude" | "longitude">
): number {
  const earthRadiusMeters = 6371000;

  const lat1 = degreesToRadians(a.latitude);
  const lat2 = degreesToRadians(b.latitude);
  const deltaLat = degreesToRadians(b.latitude - a.latitude);
  const deltaLon = degreesToRadians(b.longitude - a.longitude);

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusMeters * centralAngle;
}

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
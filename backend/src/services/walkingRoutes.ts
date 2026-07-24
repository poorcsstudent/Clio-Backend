import {
  getTourStopsForTour,
  tours,
  type TourStop,
} from "../data/campuses";
import { MISSOURI_S_AND_T_CAMPUS_ID } from "../data/degreeTours";

export interface WalkingCoordinate {
  latitude: number;
  longitude: number;
}

export interface WalkingRouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  path: WalkingCoordinate[];
}

export interface WalkingRouteLeg {
  fromStopId: string;
  toStopId: string;
  distanceMeters: number;
  durationSeconds: number;
  path: WalkingCoordinate[];
  steps: WalkingRouteStep[];
}

export interface CampusWalkingRoute {
  campusId: string;
  tourId: string;
  travelMode: "WALK";
  provider: "clio-coordinate-fallback";
  providerConfigured: false;
  distanceMeters: number;
  durationSeconds: number;
  path: WalkingCoordinate[];
  legs: WalkingRouteLeg[];
  generatedAt: string;
  warning: string;
}

function coordinate(stop: TourStop): WalkingCoordinate {
  return { latitude: stop.latitude, longitude: stop.longitude };
}

function straightLineDistanceMeters(
  from: WalkingCoordinate,
  to: WalkingCoordinate,
) {
  const earthRadiusMeters = 6_371_000;
  const radians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const fromLatitude = radians(from.latitude);
  const toLatitude = radians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
}

export function createFallbackWalkingRoute(
  tourId: string,
  stops: TourStop[],
): CampusWalkingRoute {
  const legs = stops.slice(1).map((destination, destinationIndex) => {
    const origin = stops[destinationIndex];
    const path = [coordinate(origin), coordinate(destination)];
    const distanceMeters = Math.round(
      straightLineDistanceMeters(path[0], path[1]),
    );
    const durationSeconds = Math.max(1, Math.round(distanceMeters / 1.35));

    return {
      fromStopId: origin.id,
      toStopId: destination.id,
      distanceMeters,
      durationSeconds,
      path,
      steps: [
        {
          instruction: `Walk toward ${destination.name} using posted pedestrian paths.`,
          distanceMeters,
          durationSeconds,
          path,
        },
      ],
    };
  });

  return {
    campusId: MISSOURI_S_AND_T_CAMPUS_ID,
    tourId,
    travelMode: "WALK",
    provider: "clio-coordinate-fallback",
    providerConfigured: false,
    distanceMeters: legs.reduce((total, leg) => total + leg.distanceMeters, 0),
    durationSeconds: legs.reduce(
      (total, leg) => total + leg.durationSeconds,
      0,
    ),
    path: stops.map(coordinate),
    legs,
    generatedAt: new Date().toISOString(),
    warning:
      "Clio connects verified campus coordinates directly. Follow posted pedestrian paths and accessibility guidance while walking.",
  };
}

export async function getCampusWalkingRoute(tourId: string) {
  const tour = tours.find(candidate => candidate.id === tourId);
  if (!tour) return null;
  return createFallbackWalkingRoute(tourId, getTourStopsForTour(tourId));
}

import {
  getTourStopsForTour,
  tours,
  type TourStop,
} from "../data/campuses";
import { MISSOURI_S_AND_T_CAMPUS_ID } from "../data/degreeTours";
import {
  pilotWalkingRoutes,
  type PilotWalkingCoordinate,
  type PilotWalkingRouteDefinition,
} from "../data/pilotWalkingRoutes";

export interface WalkingCoordinate {
  latitude: number;
  longitude: number;
}

export interface WalkingRouteStep {
  instruction: string;
  maneuver?: "depart" | "continue" | "turn" | "arrive";
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
  provider: "clio-campus-pilot" | "clio-coordinate-fallback";
  providerConfigured: boolean;
  fieldVerified: boolean;
  distanceMeters: number;
  durationSeconds: number;
  path: WalkingCoordinate[];
  legs: WalkingRouteLeg[];
  generatedAt: string;
  warning: string;
  attribution?: string;
  lastReviewed?: string;
  sourceUrls?: string[];
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

function pathDistanceMeters(path: WalkingCoordinate[]) {
  return Math.round(
    path
      .slice(1)
      .reduce(
        (total, coordinate, index) =>
          total + straightLineDistanceMeters(path[index], coordinate),
        0,
      ),
  );
}

function walkingDurationSeconds(distanceMeters: number) {
  return Math.max(1, Math.round(distanceMeters / 1.35));
}

function sameCoordinate(
  first: WalkingCoordinate,
  second: WalkingCoordinate,
) {
  return (
    Math.abs(first.latitude - second.latitude) < 0.000001 &&
    Math.abs(first.longitude - second.longitude) < 0.000001
  );
}

function copyPath(path: PilotWalkingCoordinate[]): WalkingCoordinate[] {
  return path.map(point => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));
}

function createPilotWalkingRoute(
  definition: PilotWalkingRouteDefinition,
  stops: TourStop[],
): CampusWalkingRoute | null {
  if (definition.legs.length !== Math.max(0, stops.length - 1)) return null;

  const legs: WalkingRouteLeg[] = [];
  for (const [index, definitionLeg] of definition.legs.entries()) {
    const origin = stops[index];
    const destination = stops[index + 1];
    if (
      !origin ||
      !destination ||
      definitionLeg.fromStopId !== origin.id ||
      definitionLeg.toStopId !== destination.id
    ) {
      return null;
    }

    const path = copyPath(definitionLeg.path);
    if (
      path.length < 2 ||
      !sameCoordinate(path[0], coordinate(origin)) ||
      !sameCoordinate(path[path.length - 1], coordinate(destination))
    ) {
      return null;
    }

    const distanceMeters = pathDistanceMeters(path);
    const steps: WalkingRouteStep[] = definitionLeg.steps.map(step => {
      const stepPath = copyPath(step.path);
      const stepDistanceMeters = pathDistanceMeters(stepPath);
      return {
        instruction: step.instruction,
        maneuver: step.maneuver,
        distanceMeters: stepDistanceMeters,
        durationSeconds: walkingDurationSeconds(stepDistanceMeters),
        path: stepPath,
      };
    });

    legs.push({
      fromStopId: origin.id,
      toStopId: destination.id,
      distanceMeters,
      durationSeconds: walkingDurationSeconds(distanceMeters),
      path,
      steps,
    });
  }

  const distanceMeters = legs.reduce(
    (total, leg) => total + leg.distanceMeters,
    0,
  );

  return {
    campusId: MISSOURI_S_AND_T_CAMPUS_ID,
    tourId: definition.tourId,
    travelMode: "WALK",
    provider: "clio-campus-pilot",
    providerConfigured: true,
    fieldVerified: definition.fieldVerified,
    distanceMeters,
    durationSeconds: legs.reduce(
      (total, leg) => total + leg.durationSeconds,
      0,
    ),
    path: legs.flatMap((leg, index) =>
      index === 0 ? leg.path : leg.path.slice(1),
    ),
    legs,
    generatedAt: new Date().toISOString(),
    warning: definition.fieldVerified
      ? "Follow the highlighted pedestrian route and all posted accessibility and safety guidance."
      : "Walking pilot geometry has not completed an on-campus field check. Follow posted pedestrian paths, crossings, accessibility guidance, and current campus conditions.",
    attribution: definition.attribution,
    lastReviewed: definition.lastReviewed,
    sourceUrls: definition.sourceUrls,
  };
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
    const durationSeconds = walkingDurationSeconds(distanceMeters);

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
    fieldVerified: false,
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
  const stops = getTourStopsForTour(tourId);
  const pilotDefinition = pilotWalkingRoutes.get(tourId);
  if (pilotDefinition) {
    const pilotRoute = createPilotWalkingRoute(pilotDefinition, stops);
    if (pilotRoute) return pilotRoute;
  }
  return createFallbackWalkingRoute(tourId, stops);
}

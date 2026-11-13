import type { WalkingCoordinate, WalkingRouteStep } from './api';

export const TOUR_OFF_ROUTE_THRESHOLD_METERS = 60;

function toLocalMeters(
  coordinate: WalkingCoordinate,
  origin: WalkingCoordinate,
) {
  const latitudeRadians = (origin.latitude * Math.PI) / 180;
  return {
    x:
      (coordinate.longitude - origin.longitude) *
      111_320 *
      Math.cos(latitudeRadians),
    y: (coordinate.latitude - origin.latitude) * 110_540,
  };
}

function distanceToSegmentMeters(
  coordinate: WalkingCoordinate,
  start: WalkingCoordinate,
  end: WalkingCoordinate,
) {
  const point = toLocalMeters(coordinate, start);
  const segmentEnd = toLocalMeters(end, start);
  const segmentLengthSquared =
    segmentEnd.x * segmentEnd.x + segmentEnd.y * segmentEnd.y;

  if (segmentLengthSquared === 0) {
    return Math.hypot(point.x, point.y);
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      (point.x * segmentEnd.x + point.y * segmentEnd.y) /
        segmentLengthSquared,
    ),
  );
  return Math.hypot(
    point.x - projection * segmentEnd.x,
    point.y - projection * segmentEnd.y,
  );
}

export function distanceToWalkingPathMeters(
  coordinate: WalkingCoordinate,
  path: WalkingCoordinate[],
) {
  if (path.length === 0) return Number.POSITIVE_INFINITY;
  if (path.length === 1) {
    return distanceToSegmentMeters(coordinate, path[0], path[0]);
  }

  return path
    .slice(1)
    .reduce(
      (minimum, end, index) =>
        Math.min(
          minimum,
          distanceToSegmentMeters(coordinate, path[index], end),
        ),
      Number.POSITIVE_INFINITY,
    );
}

export function nearestWalkingStepIndex(
  coordinate: WalkingCoordinate,
  steps: WalkingRouteStep[],
) {
  if (steps.length === 0) return 0;

  return steps.reduce(
    (nearest, step, index) => {
      const distanceMeters = distanceToWalkingPathMeters(
        coordinate,
        step.path,
      );
      return distanceMeters < nearest.distanceMeters
        ? { index, distanceMeters }
        : nearest;
    },
    { index: 0, distanceMeters: Number.POSITIVE_INFINITY },
  ).index;
}

export function isOffPilotRoute(
  distanceMeters: number | null,
  accuracyMeters: number | null,
) {
  return (
    distanceMeters !== null &&
    Number.isFinite(distanceMeters) &&
    distanceMeters > TOUR_OFF_ROUTE_THRESHOLD_METERS &&
    accuracyMeters !== null &&
    Number.isFinite(accuracyMeters) &&
    accuracyMeters <= 50
  );
}

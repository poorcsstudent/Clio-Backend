import assert from 'node:assert/strict';
import test from 'node:test';

import {
  distanceToWalkingPathMeters,
  isOffPilotRoute,
  nearestWalkingStepIndex,
  TOUR_OFF_ROUTE_THRESHOLD_METERS,
} from './walkingNavigation';

const route = [
  { latitude: 37.95482, longitude: -91.77634 },
  { latitude: 37.9551, longitude: -91.7759 },
  { latitude: 37.9555, longitude: -91.7755 },
];

test('distance to a walking path is near zero on the route', () => {
  const distance = distanceToWalkingPathMeters(
    { latitude: 37.9551, longitude: -91.7759 },
    route,
  );

  assert.ok(distance < 0.5);
});

test('off-route detection requires both distance and reliable accuracy', () => {
  assert.equal(isOffPilotRoute(TOUR_OFF_ROUTE_THRESHOLD_METERS + 1, 12), true);
  assert.equal(isOffPilotRoute(TOUR_OFF_ROUTE_THRESHOLD_METERS - 1, 12), false);
  assert.equal(isOffPilotRoute(TOUR_OFF_ROUTE_THRESHOLD_METERS + 20, 80), false);
  assert.equal(isOffPilotRoute(null, 12), false);
});

test('nearest walking step follows the user along the route', () => {
  const steps = [
    {
      instruction: 'First',
      distanceMeters: 20,
      durationSeconds: 15,
      path: route.slice(0, 2),
    },
    {
      instruction: 'Second',
      distanceMeters: 30,
      durationSeconds: 22,
      path: route.slice(1),
    },
  ];

  assert.equal(
    nearestWalkingStepIndex(
      { latitude: 37.95545, longitude: -91.77552 },
      steps,
    ),
    1,
  );
});

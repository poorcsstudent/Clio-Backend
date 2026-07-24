import assert from 'node:assert/strict';
import test from 'node:test';

import {
  distanceBetweenCoordinatesMeters,
  isReliableTourArrival,
  TOUR_ARRIVAL_RADIUS_METERS,
} from './tourLocation';

test('campus-scale distances use geographic coordinates', () => {
  const distance = distanceBetweenCoordinatesMeters(
    { latitude: 37.9548, longitude: -91.7758 },
    { latitude: 37.953, longitude: -91.7752 },
  );

  assert.ok(distance > 190);
  assert.ok(distance < 220);
});

test('arrival requires both proximity and a reliable GPS fix', () => {
  assert.equal(isReliableTourArrival(TOUR_ARRIVAL_RADIUS_METERS - 1, 12), true);
  assert.equal(isReliableTourArrival(TOUR_ARRIVAL_RADIUS_METERS + 1, 12), false);
  assert.equal(isReliableTourArrival(10, 65), false);
  assert.equal(isReliableTourArrival(10, null), false);
});

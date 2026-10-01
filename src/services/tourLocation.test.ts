import assert from 'node:assert/strict';
import test from 'node:test';

import {
  distanceBetweenCoordinatesMeters,
  createArrivalTracker,
  isReliableTourArrival,
  TOUR_ARRIVAL_RADIUS_METERS,
} from './tourLocation';

test('arrival requires distinct fresh readings and eight seconds of dwell', () => {
  const check = createArrivalTracker();
  assert.equal(check(10, 5, 1000, 1000), false);
  assert.equal(check(10, 5, 1000, 2000), false);
  assert.equal(check(10, 5, 5000, 5000), false);
  assert.equal(check(10, 5, 9000, 9000), true);
});

test('unreliable, stale, future and out-of-radius fixes cannot count as arrival', () => {
  for (const fix of [[10, 80, 5000, 5000], [80, 5, 5000, 5000], [10, 5, 5000, 20000], [10, 5, 6000, 5000]]) {
    const check = createArrivalTracker();
    check(10, 5, 1000, 1000);
    assert.equal(check(...fix as [number, number, number, number]), false);
    assert.equal(check(10, 5, 21000, 21000), false);
    assert.equal(check(10, 5, 25000, 25000), false);
    assert.equal(check(10, 5, 29000, 29000), true);
  }
});

test('long gaps restart dwell and invalid distances are rejected', () => {
  const check = createArrivalTracker();
  check(10, 5, 1000, 1000);
  check(10, 5, 5000, 5000);
  assert.equal(check(10, 5, 25000, 25000), false);
  assert.equal(isReliableTourArrival(-1, 5), false);
  assert.equal(isReliableTourArrival(1, -1), false);
  assert.equal(isReliableTourArrival(NaN, 5), false);
});

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

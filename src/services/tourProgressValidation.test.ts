import assert from 'node:assert/strict';
import test from 'node:test';
import { validTourProgress, validSavedRoute } from './tourProgressValidation';
const saved = { origin: 'api', savedAt: 1000, stopIndex: 0, session: {
  sessionId: 's', campusId: 'mst', stopCount: 1,
  tour: { id: 'cs', name: 'CS', description: 'Tour', audience: 'undergraduate-degree',
    rootStopId: 'h', routeStrategy: 'curated', stopCount: 1 },
  stops: [{ id: 'h', name: 'Havener', latitude: 37, longitude: -91,
    campusId: 'mst', tourTags: ['cs'], order: 0, description: 'Student center' }],
} };

test('checkpoint rejects malformed tour display fields and lists', () => {
  for (const patch of [{ name: {} }, { description: null }, { degreeTypes: 'BS' },
    { emphasisAreas: [{}] }, { catalogUrl: {} }, { audience: 'unknown' },
    { routeStrategy: null }, { rootStopId: '' }, { stopCount: 2 }]) {
    const session = { ...saved.session, tour: { ...saved.session.tour, ...patch } };
    assert.equal(validTourProgress({ ...saved, session }, 'api', 2000), false);
  }
});

test('checkpoint rejects malformed narration, stop lists, and session identity', () => {
  for (const patch of [{ description: {} }, { audioScript: [] }, { suggestedQuestions: [null] },
    { tourTags: null }, { order: NaN }, { distanceFromPreviousMeters: -1 }]) {
    const session = { ...saved.session, stops: [{ ...saved.session.stops[0], ...patch }] };
    assert.equal(validTourProgress({ ...saved, session }, 'api', 2000), false);
  }
  for (const patch of [{ sessionId: ' ' }, { campusId: null }, { stopCount: 3 }]) {
    assert.equal(validTourProgress({ ...saved, session: { ...saved.session, ...patch } }, 'api', 2000), false);
  }
});
test('saved routes reject malformed nested geometry and mismatched tours', () => {
  const point = { latitude: 37, longitude: -91 };
  const leg = { fromStopId: 'a', toStopId: 'b', path: [point], distanceMeters: 1, durationSeconds: 1, steps: [{ instruction: 'Walk', path: [point], distanceMeters: 1, durationSeconds: 1 }] };
  const route = { tourId: 'cs', travelMode: 'WALK', provider: 'clio-campus-pilot', fieldVerified: false, path: [point], distanceMeters: 1, durationSeconds: 1, legs: [leg] };
  assert.equal(validSavedRoute(route, 'cs'), true);
  for (const value of [null, {}, { ...route, tourId: 'other' }, { ...route, path: [null] }, { ...route, legs: [null] }, { ...route, legs: [{ ...leg, steps: [{}] }] }, { ...route, distanceMeters: -1 }]) {
    assert.equal(validSavedRoute(value, 'cs'), false);
  }
});
test('tour progress accepts a current same-origin checkpoint', () => {
  assert.equal(validTourProgress(saved, 'api', 2000), true);
});
test('tour progress rejects stale, foreign, out-of-range and malformed checkpoints', () => {
  assert.equal(validTourProgress(saved, 'other', 2000), false);
  assert.equal(validTourProgress(saved, 'api', 999), false);
  assert.equal(validTourProgress(saved, 'api', 1001 + 7 * 86400000), false);
  for (const value of [null, {}, { ...saved, stopIndex: -1 }, { ...saved, stopIndex: 1 }, { ...saved, session: { ...saved.session, stops: [{}] } }]) {
    assert.equal(validTourProgress(value, 'api', 2000), false);
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { optionalPositionWithin, reliableVisionCoordinates } from './visionLocation';

const fix = { timestamp: 20000, coords: { latitude: 37.95, longitude: -91.77, accuracy: 12 } };
test('vision accepts fresh accurate coordinates', () => {
  assert.deepEqual(reliableVisionCoordinates(fix, 21000), { latitude: 37.95, longitude: -91.77 });
});
test('vision excludes stale, future, inaccurate and malformed fixes', () => {
  assert.equal(reliableVisionCoordinates(null), undefined);
  assert.equal(reliableVisionCoordinates(fix, 40000), undefined);
  assert.equal(reliableVisionCoordinates(fix, 19000), undefined);
  for (const accuracy of [null, NaN, -1, 51]) {
    assert.equal(reliableVisionCoordinates({ ...fix, coords: { ...fix.coords, accuracy } }, 21000), undefined);
  }
  assert.equal(reliableVisionCoordinates({ ...fix, coords: { ...fix.coords, latitude: 91 } }, 21000), undefined);
});
test('optional GPS resolves failures and timeouts without blocking identification', async () => {
  assert.equal(await optionalPositionWithin(Promise.resolve(42)), 42);
  assert.equal(await optionalPositionWithin(Promise.reject(new Error('GPS unavailable'))), null);
  assert.equal(await optionalPositionWithin(new Promise(() => {}), 5), null);
});

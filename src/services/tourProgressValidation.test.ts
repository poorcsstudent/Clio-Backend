import assert from 'node:assert/strict';
import test from 'node:test';
import { validTourProgress } from './tourProgressValidation';
const saved = { origin: 'api', savedAt: 1000, stopIndex: 0, session: { sessionId: 's', tour: { id: 'cs', name: 'CS' }, stops: [{ id: 'h', name: 'Havener', latitude: 37, longitude: -91 }] } };
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

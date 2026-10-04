import assert from 'node:assert/strict';
import test from 'node:test';
import { createAiHealthTracker } from './aiHealth';
test('health does not equate configuration or retrieval with a provider response', () => {
  const health = createAiHealthTracker();
  assert.equal(health.snapshot().lastOutcome, 'not-observed');
  assert.equal(health.snapshot().recent, false);
  health.record('retrieval-only', 1000);
  assert.equal(health.snapshot(2000).lastOutcome, 'retrieval-only');
  health.record('provider-response', 2000);
  assert.equal(health.snapshot(3000).recent, true);
  assert.equal(health.snapshot(302001).recent, false);
  health.record('request-failed', 4000);
  assert.equal(health.snapshot(5000).lastOutcome, 'request-failed');
});

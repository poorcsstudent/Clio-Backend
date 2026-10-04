import assert from 'node:assert/strict';
import test from 'node:test';
import { describeAiStatus } from './aiStatus';

test('AI status distinguishes recent responses, fallback, and stale observations', () => {
  const status = (lastOutcome: string, recent = true) => ({ configured: true, observation: { lastOutcome, recent } });
  assert.match(describeAiStatus(status('provider-response')), /received a provider response/);
  assert.match(describeAiStatus(status('retrieval-only')), /not a provider answer/);
  assert.match(describeAiStatus(status('request-failed')), /does not identify the cause/);
  assert.match(describeAiStatus(status('provider-response', false)), /unconfirmed/);
});

test('AI status does not echo malformed or arbitrary server text', () => {
  for (const value of [null, {}, 'secret', { configured: true, observation: { recent: true, lastOutcome: 'secret' } }]) {
    assert.equal(describeAiStatus(value).includes('secret'), false);
  }
});

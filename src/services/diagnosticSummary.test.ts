import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnosticSummary } from './diagnosticSummary';

test('diagnostics only serialize allowlisted state and request metrics', () => {
  const input = { platform: 'ios', phase: 'ready', paired: true, glassesConnected: false,
    wakeEnabled: true, nativeSpeechAvailable: true,
    lastRequest: { kind: 'camera' as const, succeeded: false, durationMs: 1234.5, token: 'SECRET' },
    transcript: 'PRIVATE QUESTION', apiKey: 'SECRET', image: 'PRIVATE IMAGE' };
  const text = diagnosticSummary(input);
  assert.equal(text.includes('SECRET'), false);
  assert.equal(text.includes('PRIVATE'), false);
  assert.equal(JSON.parse(text).lastRequest.durationMs, 1235);
});
test('unknown enum values and invalid durations are not echoed', () => {
  const result = JSON.parse(diagnosticSummary({ platform: 'SECRET', phase: 'SECRET', paired: false,
    glassesConnected: false, wakeEnabled: false, nativeSpeechAvailable: false,
    lastRequest: { kind: 'question', succeeded: false, durationMs: NaN } }));
  assert.equal(result.platform, 'other');
  assert.equal(result.phase, 'unknown');
  assert.equal(result.lastRequest.durationMs, null);
});

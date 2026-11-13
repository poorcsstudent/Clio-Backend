import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpeechEventGate } from './speechEventGate';
test('a late tour cancellation cannot finish a newer answer', () => {
  const gate = createSpeechEventGate(); gate.begin('tour-1'); gate.cancel(); gate.begin('answer-2');
  assert.equal(gate.accepts('tour-1'), false); assert.equal(gate.finish('tour-1'), false);
  assert.equal(gate.accepts('answer-2'), true); assert.equal(gate.finish('answer-2'), true);
});
test('unidentified and duplicate speech events cannot release focus', () => {
  const gate = createSpeechEventGate(); gate.begin('answer-1');
  for (const id of [undefined, null, {}, 1, '']) assert.equal(gate.finish(id), false);
  assert.equal(gate.finish('answer-1'), true); assert.equal(gate.finish('answer-1'), false);
});
test('cancelled preparation rejects subsequent queued and started events', () => {
  const gate = createSpeechEventGate(); gate.begin('pending'); gate.cancel();
  assert.equal(gate.accepts('pending'), false);
});

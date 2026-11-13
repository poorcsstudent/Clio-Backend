import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocationEpoch } from './locationEpoch';

test('pause invalidates in-flight callbacks before watch cleanup', () => {
  const gate = createLocationEpoch(), beforePause = gate.begin(1000);
  assert.equal(beforePause.accepts(1100), true);
  gate.invalidate(); assert.equal(beforePause.accepts(1200), false);
});
test('resume rejects cached pre-resume positions and old cleanup cannot cancel it', () => {
  const gate = createLocationEpoch(), old = gate.begin(1000), resumed = gate.begin(2000);
  old.cancel(); assert.equal(resumed.current(), true);
  assert.equal(resumed.accepts(1999), false); assert.equal(resumed.accepts(2000), true);
  assert.equal(resumed.accepts(NaN), false); assert.equal(resumed.accepts(Infinity), false);
});
test('changing stops invalidates the prior arrival callback', () => {
  const gate = createLocationEpoch(), previousStop = gate.begin(1000);
  gate.invalidate(); const nextStop = gate.begin(1500);
  assert.equal(previousStop.current(), false); assert.equal(nextStop.accepts(1600), true);
  nextStop.cancel(); assert.equal(nextStop.current(), false);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { validateTranscription } from './transcription';

test('transcription trims recognized speech without silently truncating it', () => {
  assert.deepEqual(validateTranscription({ text: ' Where is Havener? ', extra: 'ignored' }), { text: 'Where is Havener?' });
  assert.equal(validateTranscription({ text: 'x'.repeat(500) }).text.length, 500);
  assert.throws(() => validateTranscription({ text: 'x'.repeat(501) }), /shorter question/);
});

test('empty and malformed transcription responses fail before question submission', () => {
  for (const value of [null, {}, [], { text: 1 }, { text: {} }, { text: '' }, { text: '  ' }, { text: 'a' }]) {
    assert.throws(() => validateTranscription(value));
  }
});

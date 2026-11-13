import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCampusAnswer } from './campusAnswer';

const valid = { answer: 'Havener is the student center.', provider: 'groq', sources: [
  { id: 'havener', title: 'Havener', campusId: 'mst', content: 'Student center', score: 1 },
] };

test('answer validation preserves provider and retrieval-only responses', () => {
  assert.deepEqual(validateCampusAnswer(valid), valid);
  assert.equal(validateCampusAnswer({ ...valid, provider: 'retrieval-only', sources: [] }).provider, 'retrieval-only');
});

test('incomplete answers and malformed sources fail before rendering or speech', () => {
  for (const value of [null, {}, { ...valid, answer: ' ' }, { ...valid, answer: 7 },
    { ...valid, provider: 'unknown' }, { ...valid, sources: null },
    { ...valid, sources: [null] }, { ...valid, sources: [{ ...valid.sources[0], title: {} }] },
    { ...valid, sources: [{ ...valid.sources[0], score: Infinity }] }]) {
    assert.throws(() => validateCampusAnswer(value), /incomplete answer/);
  }
});

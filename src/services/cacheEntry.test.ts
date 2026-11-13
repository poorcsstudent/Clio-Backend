import assert from 'node:assert/strict';
import test from 'node:test';
import { readCacheEntry } from './cacheEntry';
test('cache entries are scoped to API origin and path and expire after thirty days', () => {
  const key = 'https://example.test/tours';
  const raw = JSON.stringify({ version: 1, key, savedAt: 1000, data: [{ id: 'tour' }] });
  assert.deepEqual(readCacheEntry(raw, key, 2000)?.data, [{ id: 'tour' }]);
  assert.equal(readCacheEntry(raw, 'https://other.test/tours', 2000), null);
  assert.equal(readCacheEntry(raw, key, 999), null);
  assert.equal(readCacheEntry(raw, key, 1001 + 30 * 86400000), null);
});
test('corrupt, missing and unknown-version entries are ignored', () => {
  for (const raw of [null, '{', '{}', JSON.stringify({ version: 2, key: 'k', savedAt: 1, data: [] })]) {
    assert.equal(readCacheEntry(raw, 'k', 2), null);
  }
});

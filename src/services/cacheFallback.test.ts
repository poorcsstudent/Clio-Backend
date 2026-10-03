import assert from 'node:assert/strict';
import test from 'node:test';
import { cacheFallback } from './cacheFallback';

test('successful network data survives a storage write failure', async () => {
  assert.equal(await cacheFallback('k', async () => 42, {
    read: async () => null, write: async () => { throw new Error('disk full'); },
  }, () => assert.fail('must not label live data cached')), 42);
});
test('network failure returns saved data and reports its timestamp', async () => {
  const savedAt = Date.now();
  let reported = 0;
  assert.deepEqual(await cacheFallback('k', async () => { throw new Error('offline'); }, {
    read: async () => JSON.stringify({ key: 'k', version: 1, savedAt, data: ['tour'] }),
    write: async () => assert.fail('must not write failed responses'),
  }, date => { reported = date; }), ['tour']);
  assert.equal(reported, savedAt);
});
test('missing or unreadable cache preserves the original network failure', async () => {
  const error = new Error('offline');
  for (const read of [async () => null, async () => '{', async () => { throw new Error('disk'); }]) {
    await assert.rejects(cacheFallback('k', async () => { throw error; }, { read, write: async () => {} }, () => {}), reason => reason === error);
  }
});

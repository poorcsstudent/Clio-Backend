import assert from 'node:assert/strict';
import test from 'node:test';
import { RequestTimeoutError, withRequestDeadline } from './requestDeadline';

test('deadline returns success and preserves non-timeout failures', async () => {
  assert.equal(await withRequestDeadline(async () => 42), 42);
  const failure = new Error('offline');
  await assert.rejects(withRequestDeadline(async () => { throw failure; }), error => error === failure);
});
test('deadline aborts a hung operation and never retries it', async () => {
  let attempts = 0;
  let signal: AbortSignal | undefined;
  await assert.rejects(withRequestDeadline(s => {
    attempts++;
    signal = s;
    return new Promise(() => {});
  }, 5), RequestTimeoutError);
  assert.equal(attempts, 1);
  assert.equal(signal?.aborted, true);
});
test('deadline also covers delayed body processing', async () => {
  await assert.rejects(withRequestDeadline(async () => {
    await Promise.resolve('headers');
    return new Promise(() => {});
  }, 5), RequestTimeoutError);
});

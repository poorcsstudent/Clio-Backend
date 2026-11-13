import assert from 'node:assert/strict';
import test from 'node:test';
import { assertRequestActive, RequestTimeoutError } from './requestDeadline';

test('request checkpoints reject cancellation after asynchronous credentials resolve', async () => {
  const controller = new AbortController();
  let release!: () => void;
  const credentials = new Promise<void>(resolve => { release = resolve; });
  let sent = false;
  const operation = (async () => {
    assertRequestActive(controller.signal);
    await credentials;
    assertRequestActive(controller.signal);
    sent = true;
  })();
  controller.abort();
  release();
  await assert.rejects(operation, RequestTimeoutError);
  assert.equal(sent, false);
});

test('active and omitted cancellation signals remain usable', () => {
  assertRequestActive();
  assertRequestActive(null);
  assertRequestActive(new AbortController().signal);
});

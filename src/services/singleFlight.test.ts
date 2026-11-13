import assert from 'node:assert/strict';
import test from 'node:test';
import { singleFlight } from './singleFlight';

test('concurrent callers share one operation and settled results are not cached', async () => {
  let calls = 0;
  const run = singleFlight(async () => ++calls);
  const first = run();
  assert.equal(run(), first);
  assert.deepEqual(await Promise.all([first, run()]), [1, 1]);
  assert.equal(await run(), 2);
});
test('failure clears the in-flight operation for a deliberate new attempt', async () => {
  let calls = 0;
  const run = singleFlight(async () => {
    if (++calls === 1) throw new Error('offline');
    return 'recovered';
  });
  await assert.rejects(run(), /offline/);
  assert.equal(await run(), 'recovered');
});

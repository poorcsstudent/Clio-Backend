import test from 'node:test';
import assert from 'node:assert/strict';
import { createOwnedResource } from './ownedResource';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
test('detach during a pending status query never starts abandoned tracking', async () => {
  const query = deferred<boolean>(); const entered = deferred<void>();
  let starts = 0, queries = 0;
  const resource = createOwnedResource<string>({ isStarted: async () => { if (++queries === 1) { entered.resolve(); return query.promise; } return false; }, start: async () => { starts++; }, stop: async () => {} });
  const detach = resource.attach('tour', () => {});
  await entered.promise; detach(); query.resolve(false); await resource.settled();
  assert.equal(starts, 0); assert.equal(resource.current(), null);
});
test('detach while native start is in flight stops it when start completes', async () => {
  const gate = deferred<void>(); const entered = deferred<void>();
  let started = false, stops = 0;
  const resource = createOwnedResource<string>({ isStarted: async () => started, start: async () => { entered.resolve(); await gate.promise; started = true; }, stop: async () => { stops++; started = false; } });
  const detach = resource.attach('tour', () => {}); await entered.promise;
  detach(); gate.resolve(); await resource.settled();
  assert.equal(started, false); assert.equal(stops, 1);
});
test('old cleanup and cold-task reconciliation cannot stop a replacement owner', async () => {
  let started = true, stops = 0;
  const resource = createOwnedResource<string>({ isStarted: async () => started, start: async () => { started = true; }, stop: async () => { stops++; started = false; } });
  const old = resource.attach('old', () => {}); await resource.settled(); old();
  void resource.reconcile(); resource.attach('new', () => {}); old();
  await resource.settled(); assert.equal(resource.current(), 'new'); assert.equal(stops, 0);
});
test('a failed stop reaches the detached owner and can be retried', async () => {
  let started = true, attempts = 0, errors = 0;
  const resource = createOwnedResource<string>({ isStarted: async () => started, start: async () => {}, stop: async () => { if (++attempts === 1) throw Error('OS failure'); started = false; } });
  const detach = resource.attach('tour', () => { errors++; }); await resource.settled();
  detach(); await resource.settled(); assert.equal(errors, 1); assert.equal(started, true);
  await resource.reconcile(); assert.equal(started, false);
});
test('an unowned cold-start task stops tracking instead of resuming a saved tour', async () => {
  let stops = 0;
  const resource = createOwnedResource<string>({ isStarted: async () => true, start: async () => { throw Error('must not start'); }, stop: async () => { stops++; } });
  await resource.reconcile(); assert.equal(stops, 1);
});

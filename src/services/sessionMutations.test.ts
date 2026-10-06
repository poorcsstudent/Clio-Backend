import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionMutations } from './sessionMutations';

test('pairing blocks refresh and an older completion cannot unlock a newer pairing', () => {
  const state = createSessionMutations();
  const first = state.beginPairing();
  assert.throws(() => state.assertAvailable(), /in progress/);
  const second = state.beginPairing();
  state.finishPairing(first);
  assert.throws(() => state.assertAvailable(), /in progress/);
  state.finishPairing(second);
  state.assertAvailable();
  state.beginPairing();
  state.invalidate();
  state.assertAvailable();
});

test('old refresh cannot commit after disconnect invalidates it', async () => {
  const state = createSessionMutations();
  const ticket = state.current();
  state.invalidate();
  let saved = false;
  await assert.rejects(state.enqueue(async () => { state.assertCurrent(ticket); saved = true; }));
  assert.equal(saved, false);
});

test('disconnect deletion follows an already-started write and queue survives failure', async () => {
  const state = createSessionMutations();
  const ticket = state.current();
  const events: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const write = state.enqueue(async () => {
    events.push('write-start');
    await gate;
    events.push('write-finish');
    state.assertCurrent(ticket);
  });
  await Promise.resolve();
  state.invalidate();
  const deletion = state.enqueue(async () => { events.push('delete'); });
  release();
  await assert.rejects(write);
  await deletion;
  assert.deepEqual(events, ['write-start', 'write-finish', 'delete']);
  await state.enqueue(async () => { state.assertCurrent(state.current()); });
});

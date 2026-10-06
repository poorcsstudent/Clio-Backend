import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionMutations } from './sessionMutations';

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

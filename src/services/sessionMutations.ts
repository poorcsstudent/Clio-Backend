/** Invalidate old network work and serialize persistent credential mutations. */
export function createSessionMutations() {
  let generation = 0;
  let pairing: number | null = null;
  let tail = Promise.resolve();
  return {
    current: () => generation,
    invalidate() { pairing = null; return ++generation; },
    beginPairing() { pairing = ++generation; return generation; },
    finishPairing(ticket: number) { if (pairing === ticket) pairing = null; },
    assertAvailable() {
      if (pairing !== null) throw new Error('Pairing is in progress. Please wait and try again.');
    },
    assertCurrent(ticket: number) {
      if (ticket !== generation) throw new Error('Pairing changed while the request was running. Please try again.');
    },
    enqueue<T>(operation: () => Promise<T>): Promise<T> {
      const result = tail.then(operation);
      tail = result.then(() => undefined, () => undefined);
      return result;
    },
  };
}

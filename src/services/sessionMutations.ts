/** Invalidate old network work and serialize persistent credential mutations. */
export function createSessionMutations() {
  let generation = 0;
  let tail = Promise.resolve();
  return {
    current: () => generation,
    invalidate: () => ++generation,
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

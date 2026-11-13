/** Invalidates callbacks synchronously, before React effects clean up watches. */
export function createLocationEpoch() {
  let generation = 0;
  return {
    invalidate() { generation++; },
    begin(startedAt = Date.now()) {
      const token = ++generation;
      return {
        current: () => token === generation,
        accepts: (timestamp: number) => token === generation && Number.isFinite(timestamp) && timestamp >= startedAt,
        cancel: () => { if (token === generation) generation++; },
      };
    },
  };
}

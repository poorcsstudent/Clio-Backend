export function createAiHealthTracker() {
  let lastOutcome: 'not-observed' | 'provider-response' | 'retrieval-only' | 'request-failed' = 'not-observed';
  let observedAt: number | null = null;
  return {
    record(outcome: Exclude<typeof lastOutcome, 'not-observed'>, now = Date.now()) {
      lastOutcome = outcome;
      observedAt = now;
    },
    snapshot(now = Date.now()) {
      return {
        lastOutcome,
        observedAt: observedAt === null ? null : new Date(observedAt).toISOString(),
        recent: observedAt !== null && now >= observedAt && now - observedAt <= 5 * 60_000,
        scope: 'This server process only; historical observation, not a live provider probe.',
      };
    },
  };
}
export const aiHealth = createAiHealthTracker();

/** Native callbacks are accepted only for the current playback, never by kind alone. */
export function createSpeechEventGate() {
  let activeId: string | null = null;
  return {
    current: () => activeId,
    begin(id: string) { activeId = id; },
    accepts(id: unknown) { return typeof id === 'string' && id === activeId; },
    finish(id: unknown) {
      if (typeof id !== 'string' || id !== activeId) return false;
      activeId = null;
      return true;
    },
    cancel() { activeId = null; },
  };
}

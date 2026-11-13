type ResourceAdapter = {
  isStarted(): Promise<boolean>;
  start(): Promise<void>;
  stop(): Promise<void>;
};
type Owner<T> = { value: T; onError(error: unknown): void };

/** Serializes OS resource changes and rechecks current ownership after awaits. */
export function createOwnedResource<T>(adapter: ResourceAdapter) {
  let owner: Owner<T> | null = null;
  let operations: Promise<void> = Promise.resolve();

  function reconcile(retiredOwner: Owner<T> | null = null) {
    operations = operations.then(async () => {
      const started = await adapter.isStarted();
      // Do not use an owner captured before isStarted: pause/resume may have
      // changed the desired state while the native query was outstanding.
      if (owner && !started) await adapter.start();
      else if (!owner && started) await adapter.stop();
    }).catch(error => {
      // Preserve a detach failure even after the consumer has been removed.
      // Error reporting must not poison subsequent cleanup attempts.
      try { (owner ?? retiredOwner)?.onError(error); } catch { /* observer only */ }
    });
    return operations;
  }

  return {
    current: () => owner?.value ?? null,
    reconcile: () => reconcile(),
    settled: () => operations,
    attach(value: T, onError: Owner<T>['onError']) {
      const next = { value, onError };
      owner = next;
      void reconcile();
      return () => {
        // Cleanup from an old React effect must not detach its replacement.
        if (owner !== next) return;
        owner = null;
        void reconcile(next);
      };
    },
  };
}

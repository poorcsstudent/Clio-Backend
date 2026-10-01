/** Share concurrent work, but allow a new attempt after either outcome. */
export function singleFlight<T>(operation: () => Promise<T>) {
  let pending: Promise<T> | null = null;
  return () => {
    if (!pending) {
      pending = Promise.resolve().then(operation).finally(() => { pending = null; });
    }
    return pending;
  };
}

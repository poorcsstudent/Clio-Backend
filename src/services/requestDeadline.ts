export class RequestTimeoutError extends Error {
  constructor() {
    super('Clio took too long to respond. Check your connection and try again.');
    this.name = 'RequestTimeoutError';
  }
}

/** Bounds the whole operation, including body consumption. Never retries. */
export async function withRequestDeadline<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs = 45000): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new RequestTimeoutError());
          controller.abort();
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

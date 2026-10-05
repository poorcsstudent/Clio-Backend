export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function parseResponse<T>(response: Response): Promise<T> {
  let body: unknown;
  try { body = await response.json(); }
  catch {
    throw new ApiError(response.ok
      ? 'The server returned an unreadable response. Please try again.'
      : `Request failed (${response.status})`, response.status);
  }
  if (!response.ok) {
    const error = body && typeof body === 'object' && 'error' in body ? body.error : undefined;
    throw new ApiError(typeof error === 'string' ? error : `Request failed (${response.status})`, response.status);
  }
  if (body === null || typeof body !== 'object') {
    throw new ApiError('The server returned an unexpected response. Please try again.', response.status);
  }
  return body as T;
}

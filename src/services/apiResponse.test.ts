import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError, parseResponse } from './apiResponse';

test('API parser accepts objects and arrays but rejects malformed successful responses', async () => {
  assert.deepEqual(await parseResponse(new Response('{"answer":"Hello"}')), { answer: 'Hello' });
  assert.deepEqual(await parseResponse(new Response('[]')), []);
  for (const body of ['<html>proxy error</html>', '', 'null', 'true', '123', '"text"']) {
    await assert.rejects(parseResponse(new Response(body)), ApiError);
  }
});

test('API parser preserves HTTP status even for non-JSON and null errors', async () => {
  for (const body of ['<html>failure</html>', 'null', '{}']) {
    await assert.rejects(parseResponse(new Response(body, { status: 401 })),
      (error: unknown) => error instanceof ApiError && error.status === 401);
  }
  await assert.rejects(parseResponse(new Response('{"error":"Unavailable"}', { status: 503 })),
    (error: unknown) => error instanceof ApiError && error.status === 503 && error.message === 'Unavailable');
});

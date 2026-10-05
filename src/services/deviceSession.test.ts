import assert from 'node:assert/strict';
import test from 'node:test';
import { validateDeviceSession } from './deviceSession';

test('device sessions require usable credentials and finite positive lifetime', () => {
  const valid = { accessToken: 'access', refreshToken: 'refresh', accessTokenExpiresInSeconds: 900 };
  assert.deepEqual(validateDeviceSession(valid), valid);
  for (const value of [null, {}, [], { ...valid, accessToken: ' ' }, { ...valid, refreshToken: 12 },
    ...[0, -1, 30, NaN, Infinity, '900', Number.MAX_VALUE].map(accessTokenExpiresInSeconds => ({ ...valid, accessTokenExpiresInSeconds }))]) {
    assert.throws(() => validateDeviceSession(value), /invalid pairing session/);
  }
});

test('session validation excludes unrelated server fields', () => {
  assert.deepEqual(Object.keys(validateDeviceSession({ accessToken: 'a', refreshToken: 'b', accessTokenExpiresInSeconds: 60, extra: 'private' })).sort(),
    ['accessToken', 'accessTokenExpiresInSeconds', 'refreshToken'].sort());
});

export interface DeviceSession {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
}

/** Validate before replacing any existing pairing credentials. */
export function validateDeviceSession(value: unknown): DeviceSession {
  const session = value as Partial<DeviceSession> | null;
  if (!session || typeof session.accessToken !== 'string' || !session.accessToken.trim()
    || typeof session.refreshToken !== 'string' || !session.refreshToken.trim()
    || typeof session.accessTokenExpiresInSeconds !== 'number'
    || !Number.isFinite(session.accessTokenExpiresInSeconds)
    || session.accessTokenExpiresInSeconds <= 30
    || session.accessTokenExpiresInSeconds > Number.MAX_SAFE_INTEGER / 1000) {
    throw new Error('The server returned an invalid pairing session. Existing pairing has not been replaced.');
  }
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    accessTokenExpiresInSeconds: session.accessTokenExpiresInSeconds,
  };
}

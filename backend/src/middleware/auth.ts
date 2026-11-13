import { randomUUID, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { config } from "../config";

const ISSUER = "cliovision-api";
const AUDIENCE = "cliovision-mobile";

type TokenKind = "access" | "refresh";

interface DeviceClaims extends JwtPayload {
  sub: string;
  jti: string;
  tokenKind: TokenKind;
}

function equalSecret(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function signDeviceToken(deviceId: string, tokenKind: TokenKind) {
  return jwt.sign(
    { tokenKind },
    config.jwtSecret,
    {
      algorithm: "HS256",
      audience: AUDIENCE,
      expiresIn: tokenKind === "access" ? "15m" : "7d",
      issuer: ISSUER,
      jwtid: randomUUID(),
      subject: deviceId,
    },
  );
}

function verifyDeviceToken(token: string, expectedKind: TokenKind): DeviceClaims {
  const decoded = jwt.verify(token, config.jwtSecret, {
    algorithms: ["HS256"],
    audience: AUDIENCE,
    issuer: ISSUER,
  });

  if (
    typeof decoded === "string" ||
    decoded.tokenKind !== expectedKind ||
    typeof decoded.sub !== "string" ||
    typeof decoded.jti !== "string"
  ) {
    throw new Error("Invalid token claims");
  }

  return decoded as DeviceClaims;
}

export function enrollmentCodeMatches(received: string) {
  return equalSecret(received, config.enrollmentCode);
}

export function issueDeviceSession(deviceId: string) {
  return {
    accessToken: signDeviceToken(deviceId, "access"),
    accessTokenExpiresInSeconds: 15 * 60,
    refreshToken: signDeviceToken(deviceId, "refresh"),
  };
}

export function refreshDeviceSession(refreshToken: string) {
  const claims = verifyDeviceToken(refreshToken, "refresh");
  return issueDeviceSession(claims.sub);
}

export function readBearerToken(req: Request) {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim() || null;
}

export function requireDevice(req: Request, res: Response, next: NextFunction) {
  const token = readBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const claims = verifyDeviceToken(token, "access");
    req.device = { id: claims.sub, tokenId: claims.jti };
    next();
  } catch {
    res.status(401).json({ error: "Access token is invalid or expired" });
  }
}

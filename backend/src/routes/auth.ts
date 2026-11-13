import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

import {
  enrollmentCodeMatches,
  issueDeviceSession,
  readBearerToken,
  refreshDeviceSession,
} from "../middleware/auth";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const deviceIdSchema = z
  .string()
  .trim()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/);

router.post("/device-session", authLimiter, (req, res) => {
  const parsed = z
    .object({
      deviceId: deviceIdSchema,
      enrollmentCode: z.string().min(8).max(256),
    })
    .safeParse(req.body);

  if (!parsed.success || !enrollmentCodeMatches(parsed.data.enrollmentCode)) {
    res.status(401).json({ error: "Device enrollment failed" });
    return;
  }

  res.json(issueDeviceSession(parsed.data.deviceId));
});

router.post("/refresh", authLimiter, (req, res) => {
  const refreshToken = readBearerToken(req);
  if (!refreshToken) {
    res.status(401).json({ error: "Refresh token required" });
    return;
  }

  try {
    res.json(refreshDeviceSession(refreshToken));
  } catch {
    res.status(401).json({ error: "Refresh token is invalid or expired" });
  }
});

export default router;

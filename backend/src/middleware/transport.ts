import type { NextFunction, Request, Response } from "express";

import { config } from "../config";

export function requireSecureTransport(req: Request, res: Response, next: NextFunction) {
  if (!config.isProduction || req.secure || req.header("x-forwarded-proto") === "https") {
    next();
    return;
  }

  res.status(426).json({ error: "HTTPS is required" });
}

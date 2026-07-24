import { Router } from "express";
import rateLimit from "express-rate-limit";

import { MISSOURI_S_AND_T_CAMPUS_ID } from "../data/degreeTours";
import { getCampusWalkingRoute } from "../services/walkingRoutes";

const router = Router();

const walkingRouteLimiter = rateLimit({
  windowMs: 60 * 1_000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

router.get("/walking-route/:tourId", walkingRouteLimiter, async (req, res, next) => {
  if (
    req.query.campusId &&
    req.query.campusId !== MISSOURI_S_AND_T_CAMPUS_ID
  ) {
    res.status(404).json({ error: "Campus not found" });
    return;
  }

  try {
    const tourId = Array.isArray(req.params.tourId)
      ? req.params.tourId[0]
      : req.params.tourId;
    const route = await getCampusWalkingRoute(tourId);
    if (!route) {
      res.status(404).json({ error: "Tour not found" });
      return;
    }
    res.set("Cache-Control", "private, max-age=300");
    res.json(route);
  } catch (error) {
    next(error);
  }
});

export default router;

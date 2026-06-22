import { Router } from "express";
import { tourStops, tours } from "../data/campuses";

const router = Router();

router.post("/start", (req, res) => {
  const { campusId, tourId } = req.body;

  if (!campusId) {
    return res.status(400).json({ error: "campusId is required" });
  }

  if (!tourId) {
    return res.status(400).json({ error: "tourId is required" });
  }

  const validTour = tours.find(tour => tour.id === tourId);

  if (!validTour) {
    return res.status(400).json({
      error: "Invalid tourId",
      validTours: tours.map(tour => tour.id)
    });
  }

  const stops = tourStops
    .filter(stop => stop.campusId === campusId)
    .filter(stop => stop.tourTags.includes(tourId))
    .sort((a, b) => a.order - b.order);

  res.json({
    sessionId: `tour_${Date.now()}`,
    campusId,
    tour: validTour,
    stopCount: stops.length,
    stops
  });
});

router.post("/end", (req, res) => {
  const { sessionId } = req.body;

  res.json({
    sessionId,
    status: "ended"
  });
});

export default router;

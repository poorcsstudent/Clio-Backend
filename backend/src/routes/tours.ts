import { Router } from "express";
import { campuses, getTourStopsForTour, tours } from "../data/campuses";
import { buildDegreeTourGraph } from "../data/degreeTours";

const router = Router();

router.post("/start", (req, res) => {
  const { campusId, tourId } = req.body;

  if (!campusId) {
    return res.status(400).json({ error: "campusId is required" });
  }

  if (!tourId) {
    return res.status(400).json({ error: "tourId is required" });
  }

  const validCampus = campuses.find(campus => campus.id === campusId);

  if (!validCampus) {
    return res.status(400).json({
      error: "Invalid campusId",
      validCampuses: campuses.map(campus => campus.id),
    });
  }

  const validTour = tours.find(tour => tour.id === tourId);

  if (!validTour) {
    return res.status(400).json({
      error: "Invalid tourId",
      validTours: tours.map(tour => tour.id)
    });
  }

  const stops = getTourStopsForTour(tourId)
    .filter(stop => stop.campusId === campusId)
    .sort((a, b) => a.order - b.order);

  res.json({
    sessionId: `tour_${Date.now()}`,
    campusId,
    tour: validTour,
    stopCount: stops.length,
    stops,
    routeGraph: buildDegreeTourGraph(tourId) ?? undefined,
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

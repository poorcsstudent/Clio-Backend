import { Router } from "express";
import {
  campuses,
  getTourStopsForTour,
  tourDataMetadata,
  tourStops,
  tours,
} from "../data/campuses";
import { buildDegreeTourGraph } from "../data/degreeTours";

const router = Router();

router.get("/", (_req, res) => {
  res.json(campuses);
});

router.get("/:campusId/tours", (req, res) => {
  const campus = campuses.find(candidate => candidate.id === req.params.campusId);
  if (!campus) return res.status(404).json({ error: "Campus not found" });
  res.json({
    metadata: tourDataMetadata,
    tours,
  });
});

router.get("/:campusId", (req, res) => {
  const campus = campuses.find(c => c.id === req.params.campusId);

  if (!campus) {
    return res.status(404).json({ error: "Campus not found" });
  }

  res.json(campus);
});

router.get("/:campusId/stops", (req, res) => {
  const { campusId } = req.params;
  const { tourId } = req.query;

  let stops = tourStops.filter(stop => stop.campusId === campusId);

  if (tourId) {
    const validTour = tours.find(tour => tour.id === String(tourId));
    if (!validTour) {
      return res.status(400).json({
        error: "Invalid tourId",
        validTours: tours.map(tour => tour.id),
      });
    }
    stops = getTourStopsForTour(String(tourId))
      .filter(stop => stop.campusId === campusId);
  }

  stops.sort((a, b) => a.order - b.order);

  res.json(stops);
});

router.get("/:campusId/tour-graph/:tourId", (req, res) => {
  const { campusId, tourId } = req.params;
  if (!campuses.some(campus => campus.id === campusId)) {
    return res.status(404).json({ error: "Campus not found" });
  }
  const graph = buildDegreeTourGraph(tourId);
  if (!graph) {
    return res.status(404).json({
      error: "Degree tour graph not found",
      validDegreeTours: tours
        .filter(tour => tour.audience === "undergraduate-degree")
        .map(tour => tour.id),
    });
  }
  res.json(graph);
});

router.get("/:campusId/stops/:stopId", (req, res) => {
  const { campusId, stopId } = req.params;

  const stop = tourStops.find(
    stop => stop.campusId === campusId && stop.id === stopId
  );

  if (!stop) {
    return res.status(404).json({ error: "Stop not found" });
  }

  res.json(stop);
});
export default router;

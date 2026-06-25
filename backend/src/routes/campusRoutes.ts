import { Router } from "express";
import { campuses, tourStops, tours } from "../data/campuses";

const router = Router();

router.get("/", (_req, res) => {
  res.json(campuses);
});

router.get("/:campusId/tours", (_req, res) => {
  res.json(tours);
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
    stops = stops.filter(stop => stop.tourTags.includes(String(tourId)));
  }

  stops.sort((a, b) => a.order - b.order);

  res.json(stops);
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

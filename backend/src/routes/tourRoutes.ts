import { Router } from "express";
import { tours } from "../data/campuses";
import { CampusLocation } from "../data/campusLocations";
import { generateWalkingRoute } from "../services/routeGenerator";
import { getDistanceInMeters } from "../utils/distance";

const router = Router();

type TourSession = {
  sessionId: string;
  campusId: string;
  tourId: string;
  currentStopIndex: number;
  stops: CampusLocation[];
  startedAt: string;
  endedAt?: string;
};

const sessions: TourSession[] = [];

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

  const stops = generateWalkingRoute(tourId);

  if (stops.length === 0) {
    return res.status(404).json({
      error: "No stops found for this tour"
    });
  }

  const session: TourSession = {
    sessionId: `tour_${Date.now()}`,
    campusId,
    tourId,
    currentStopIndex: 0,
    stops,
    startedAt: new Date().toISOString()
  };

  sessions.push(session);

  res.json({
    sessionId: session.sessionId,
    campusId,
    tour: validTour,
    currentStopIndex: session.currentStopIndex,
    currentStop: stops[0],
    totalStops: stops.length,
    stops
  });
});

router.get("/:sessionId", (req, res) => {
  const session = sessions.find(s => s.sessionId === req.params.sessionId);

  if (!session) {
    return res.status(404).json({ error: "Tour session not found" });
  }

  res.json({
    sessionId: session.sessionId,
    campusId: session.campusId,
    tourId: session.tourId,
    currentStopIndex: session.currentStopIndex,
    currentStop: session.stops[session.currentStopIndex],
    totalStops: session.stops.length,
    startedAt: session.startedAt,
    endedAt: session.endedAt || null
  });
});

router.post("/next", (req, res) => {
  const { sessionId } = req.body;

  const session = sessions.find(s => s.sessionId === sessionId);

  if (!session) {
    return res.status(404).json({ error: "Tour session not found" });
  }

  if (session.currentStopIndex < session.stops.length - 1) {
    session.currentStopIndex += 1;
  }

  res.json({
    sessionId: session.sessionId,
    currentStopIndex: session.currentStopIndex,
    currentStop: session.stops[session.currentStopIndex],
    totalStops: session.stops.length,
    isComplete: session.currentStopIndex === session.stops.length - 1
  });
});

router.post("/previous", (req, res) => {
  const { sessionId } = req.body;

  const session = sessions.find(s => s.sessionId === sessionId);

  if (!session) {
    return res.status(404).json({ error: "Tour session not found" });
  }

  if (session.currentStopIndex > 0) {
    session.currentStopIndex -= 1;
  }

  res.json({
    sessionId: session.sessionId,
    currentStopIndex: session.currentStopIndex,
    currentStop: session.stops[session.currentStopIndex],
    totalStops: session.stops.length
  });
});

router.post("/end", (req, res) => {
  const { sessionId } = req.body;

  const session = sessions.find(s => s.sessionId === sessionId);

  if (!session) {
    return res.status(404).json({ error: "Tour session not found" });
  }

  session.endedAt = new Date().toISOString();

  res.json({
    sessionId: session.sessionId,
    status: "ended",
    endedAt: session.endedAt
  });
});

router.post("/location", (req, res) => {
  const { sessionId, latitude, longitude } = req.body;

  if (!sessionId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      error: "sessionId, latitude, and longitude are required"
    });
  }

  const session = sessions.find(s => s.sessionId === sessionId);

  if (!session) {
    return res.status(404).json({
      error: "Tour session not found"
    });
  }

  const currentStop = session.stops[session.currentStopIndex];

  const distance = getDistanceInMeters(
    { latitude, longitude },
    currentStop
  );

  const ARRIVAL_RADIUS_METERS = 30;
  const arrived = distance <= ARRIVAL_RADIUS_METERS;

  let advancedToNextStop = false;

  if (arrived && session.currentStopIndex < session.stops.length - 1) {
    session.currentStopIndex += 1;
    advancedToNextStop = true;
  }

  res.json({
    sessionId,
    arrived,
    playAudio: arrived,
    distanceMeters: Math.round(distance),
    completedStop: arrived ? currentStop : null,
    advancedToNextStop,
    currentStopIndex: session.currentStopIndex,
    currentStop: session.stops[session.currentStopIndex],
    totalStops: session.stops.length,
    isComplete: session.currentStopIndex === session.stops.length - 1
  });
});

export default router;
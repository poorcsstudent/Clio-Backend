import { Router } from "express";
import rateLimit from "express-rate-limit";

import { MISSOURI_S_AND_T_CAMPUS_ID } from "../data/degreeTours";
import { getCampusWalkingRoute, createNetworkWalkingRoute } from "../services/walkingRoutes";
import { PedestrianRouteError } from '../services/pedestrianRouting';
import { campusPlaces } from '../data/campusPlaces';

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
    if(error instanceof PedestrianRouteError){res.status(422).json({error:error.message,code:error.code,stopIds:error.stopIds});return;}
    next(error);
  }
});

router.post('/walking-route',walkingRouteLimiter,(req,res,next)=>{
  const ids=req.body?.stopIds;
  if(!Array.isArray(ids)||ids.length<2||ids.length>11||ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length||ids[0]!=='havener-center'){
    res.status(400).json({error:'Provide 2–11 distinct stopIds starting with havener-center.'});return;
  }
  const stops=ids.map(id=>campusPlaces.find(p=>p.id===id));
  if(stops.some(p=>!p)){res.status(400).json({error:'Unknown campus stop.'});return;}
  try{res.set('Cache-Control','no-store');res.json(createNetworkWalkingRoute('interest-tour',stops as NonNullable<typeof stops[number]>[],true));}
  catch(error){if(error instanceof PedestrianRouteError){res.status(422).json({error:error.message,code:error.code,stopIds:error.stopIds});return;}next(error);}
});

export default router;

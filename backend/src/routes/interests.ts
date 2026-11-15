import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { interestCatalog, planInterestTour } from '../services/interestTours';
const router = Router();
router.get('/', (_req,res) => res.json(interestCatalog));
router.post('/plan', rateLimit({windowMs:60000,limit:30,standardHeaders:'draft-8',legacyHeaders:false}), (req,res,next) => {
  try { res.set('Cache-Control','no-store').json(planInterestTour(req.body?.interestIds,req.body?.excludedIds)); }
  catch(error) {
    if(error instanceof Error && /Choose one|Removed stops|Include at least/.test(error.message)) { res.status(400).json({error:error.message}); return; }
    next(error);
  }
});
export default router;

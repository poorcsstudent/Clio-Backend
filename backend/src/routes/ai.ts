import { Router } from "express";
import { z } from "zod";

import { campuses } from "../data/campuses";
import { requireDevice } from "../middleware/auth";
import { answerCampusQuestion } from "../services/ai";
import { aiHealth } from "../services/aiHealth";
import { config, providerKey } from "../config";

const router = Router();

router.get('/status', requireDevice, (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ configured: Boolean(providerKey(config.aiProvider)), provider: config.aiProvider,
    observation: aiHealth.snapshot() });
});

router.post("/question", requireDevice, async (req, res, next) => {
  const parsed = z
    .object({
      question: z.string().trim().min(2).max(500),
      campusId: z.string().trim().min(2).max(100),
      currentStopId: z.string().trim().min(2).max(100).optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "A valid question and campusId are required" });
    return;
  }

  if (!campuses.some(campus => campus.id === parsed.data.campusId)) {
    res.status(404).json({ error: "Campus not found" });
    return;
  }

  try {
    const result = await answerCampusQuestion(parsed.data);
    aiHealth.record(result.provider === 'retrieval-only' ? 'retrieval-only' : 'provider-response');
    res.json({ ...parsed.data, ...result });
  } catch (error) {
    aiHealth.record('request-failed');
    next(error);
  }
});

export default router;

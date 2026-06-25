import { Router } from "express";
import { answerQuestion } from "../services/aiGuideService";

const router = Router();

router.post("/question", async (req, res) => {
  const { question, campusId, currentStopId } = req.body;

  if (!question) {
    return res.status(400).json({ error: "question is required" });
  }

  if (!campusId) {
    return res.status(400).json({ error: "campusId is required" });
  }

  if (!currentStopId) {
    return res.status(400).json({ error: "currentStopId is required" });
  }

  const response = await answerQuestion({
    question,
    campusId,
    currentStopId
  });

  res.json({
    campusId,
    currentStopId,
    question,
    ...response
  });
});

export default router;
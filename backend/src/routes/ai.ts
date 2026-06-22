import { Router } from "express";

const router = Router();

router.post("/question", (req, res) => {
  const { question, campusId, currentStopId } = req.body;

  res.json({
    campusId,
    currentStopId,
    question,
    answer:
      "This is a placeholder AI guide response. Soon this will use campus data and AI to answer tour questions."
  });
});

export default router;

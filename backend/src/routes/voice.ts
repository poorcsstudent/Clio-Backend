import { randomBytes } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import OpenAI, { toFile } from "openai";
import { z } from "zod";

import { config, providerBaseUrl, providerKey } from "../config";
import { requireDevice } from "../middleware/auth";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});
const voiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const allowedAudioTypes = new Set([
  "audio/aac",
  "audio/m4a",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "video/mp4",
]);

interface CachedSpeech {
  audio: Buffer;
  contentType: "audio/mpeg" | "audio/wav";
  createdBy: string;
  expiresAt: number;
}

const speechCache = new Map<string, CachedSpeech>();
let client: OpenAI | null = null;

function getClient() {
  const apiKey = providerKey(config.voiceProvider);
  if (!apiKey) return null;
  client ??= new OpenAI({ apiKey, baseURL: providerBaseUrl(config.voiceProvider) });
  return client;
}

function removeExpiredSpeech() {
  const now = Date.now();
  for (const [id, item] of speechCache) {
    if (item.expiresAt <= now) speechCache.delete(id);
  }
}

router.post(
  "/transcribe",
  requireDevice,
  voiceLimiter,
  upload.single("audio"),
  async (req, res, next) => {
    if (!req.file || !allowedAudioTypes.has(req.file.mimetype)) {
      res.status(400).json({ error: "A supported audio file is required" });
      return;
    }

    const openai = getClient();
    if (!openai) {
      res.status(503).json({ error: "Speech recognition is not configured" });
      return;
    }

    try {
      const file = await toFile(req.file.buffer, req.file.originalname || "question.m4a", {
        type: req.file.mimetype,
      });
      const transcript = await openai.audio.transcriptions.create({
        file,
        model: config.transcriptionModel,
        prompt: "This is a visitor asking a question about Missouri S&T campus and its buildings.",
      });
      res.json({ text: transcript.text.trim() });
    } catch (error) {
      next(error);
    }
  },
);

router.post("/speech", requireDevice, voiceLimiter, async (req, res, next) => {
  const maximumLength = config.voiceProvider === "groq" ? 200 : 2_000;
  const parsed = z.object({ text: z.string().trim().min(1).max(maximumLength) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: `Text must contain between 1 and ${maximumLength} characters` });
    return;
  }

  const openai = getClient();
  if (!openai) {
    res.status(503).json({ error: "Speech generation is not configured" });
    return;
  }

  try {
    const isGroq = config.voiceProvider === "groq";
    const speech = await openai.audio.speech.create({
      model: config.ttsModel,
      voice: config.ttsVoice,
      input: parsed.data.text,
      ...(!isGroq && {
        instructions: "Speak like a warm, clear campus tour guide. Use a natural walking-tour pace.",
      }),
      response_format: isGroq ? "wav" : "mp3",
    });
    const id = randomBytes(24).toString("base64url");
    removeExpiredSpeech();
    speechCache.set(id, {
      audio: Buffer.from(await speech.arrayBuffer()),
      contentType: isGroq ? "audio/wav" : "audio/mpeg",
      createdBy: req.device!.id,
      expiresAt: Date.now() + 2 * 60 * 1000,
    });

    res.setHeader("Cache-Control", "no-store");
    res.status(201).json({ audioPath: `/voice/speech/${id}`, expiresInSeconds: 120 });
  } catch (error) {
    next(error);
  }
});

router.get("/speech/:id", requireDevice, (req, res) => {
  removeExpiredSpeech();
  const speechId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const item = speechId ? speechCache.get(speechId) : undefined;
  if (!item || item.createdBy !== req.device!.id) {
    res.status(404).json({ error: "Speech audio not found or expired" });
    return;
  }

  res.set({
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Length": item.audio.length.toString(),
    "Content-Type": item.contentType,
    "X-Content-Type-Options": "nosniff",
  });
  res.send(item.audio);
});

export default router;

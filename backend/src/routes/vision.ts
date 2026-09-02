import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { z } from "zod";

import { campuses } from "../data/campuses";
import { requireDevice } from "../middleware/auth";
import { identifyCampusView } from "../services/vision";

const router = Router();
const allowedImageTypes = new Set(["image/jpeg", "image/png"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
});
const visionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

function hasValidImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3
      && buffer[0] === 0xff
      && buffer[1] === 0xd8
      && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return buffer.length >= pngSignature.length
      && pngSignature.every((value, index) => buffer[index] === value);
  }
  return false;
}

router.post(
  "/identify",
  requireDevice,
  visionLimiter,
  upload.single("image"),
  async (req, res, next) => {
    if (
      !req.file
      || !allowedImageTypes.has(req.file.mimetype)
      || !hasValidImageSignature(req.file.buffer, req.file.mimetype)
    ) {
      res.status(400).json({ error: "A JPEG or PNG campus image is required" });
      return;
    }

    const parsed = z.object({
      campusId: z.string().trim().min(2).max(100),
      latitude: z.coerce.number().min(-90).max(90).optional(),
      longitude: z.coerce.number().min(-180).max(180).optional(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "A valid campusId and optional coordinates are required" });
      return;
    }
    if (!campuses.some(campus => campus.id === parsed.data.campusId)) {
      res.status(404).json({ error: "Campus not found" });
      return;
    }

    const hasLocation = parsed.data.latitude !== undefined
      && parsed.data.longitude !== undefined;

    try {
      const result = await identifyCampusView({
        campusId: parsed.data.campusId,
        image: req.file.buffer,
        mimeType: req.file.mimetype as "image/jpeg" | "image/png",
        ...(hasLocation ? {
          location: {
            latitude: parsed.data.latitude!,
            longitude: parsed.data.longitude!,
          },
        } : {}),
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;

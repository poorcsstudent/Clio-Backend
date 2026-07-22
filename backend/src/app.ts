import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import multer from "multer";

import { config, providerKey } from "./config";
import { requireSecureTransport } from "./middleware/transport";
import authRoutes from "./routes/auth";
import campusRoutes from "./routes/campuses";
import tourRoutes from "./routes/tours";
import aiRoutes from "./routes/ai";
import iosInstallRoutes from "./routes/iosInstall";
import voiceRoutes from "./routes/voice";

const app = express();

app.disable("x-powered-by");
if (config.isProduction) app.set("trust proxy", 1);
app.use(helmet());
app.use(requireSecureTransport);
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin not allowed"));
  },
}));
app.use(express.json({ limit: "64kb" }));
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
}));

app.get("/", (_req, res) => {
  res.json({
    message: "ClioVision API is running",
    version: "0.3.0",
    aiConfigured: Boolean(providerKey(config.aiProvider)),
    aiProvider: config.aiProvider,
    voiceConfigured: Boolean(providerKey(config.voiceProvider)),
    voiceProvider: config.voiceProvider,
  });
});

app.use("/ios", iosInstallRoutes);
app.use("/auth", authRoutes);
app.use("/campuses", campusRoutes);
app.use("/tour", tourRoutes);
app.use("/ai-guide", aiRoutes);
app.use("/voice", voiceRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({
      error: error.code === "LIMIT_FILE_SIZE" ? "Audio file is too large" : "Invalid upload",
    });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "The request could not be completed" });
});

export default app;

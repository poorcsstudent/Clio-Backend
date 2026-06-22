import express from "express";
import cors from "cors";

import campusRoutes from "./routes/campuses";
import tourRoutes from "./routes/tours";
import aiRoutes from "./routes/ai";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "ClioVision API is running",
    version: "0.1.0"
  });
});

app.use("/campuses", campusRoutes);
app.use("/tour", tourRoutes);
app.use("/ai-guide", aiRoutes);

export default app;

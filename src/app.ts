import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import healthRouter from "./routes/health";
import singleRouter from "./routes/single";
import batchRouter from "./routes/batch";
import sequenceRouter from "./routes/sequence";
import { LIMITS } from "./config";

const app = express();

app.use(express.json({ limit: LIMITS.JSON_BODY_MAX_SIZE }));
app.use(
  express.urlencoded({ extended: true, limit: LIMITS.JSON_BODY_MAX_SIZE })
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.use("/health", healthRouter);
app.use("/single", singleRouter);
app.use("/batch", batchRouter);
app.use("/sequence", sequenceRouter);

// 404 handler
app.use("/*splat", (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
  });
});

app.use(errorHandler);

export default app;

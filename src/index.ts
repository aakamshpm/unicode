import express from "express";
import problemRoutes from "./routes/problems.js";
import submissionsRouter from "./routes/submissions.js";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { disconnectPrisma } from "./db/connection.js";
import { logger } from "./utils/logger.js";

const app = express();
const PORT = config.PORT;

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Routes
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionsRouter);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT} [${config.NODE_ENV}]`);
});

// Graceful shutdown
async function shutdown() {
  logger.info("Shutting down gracefully...");
  server.close(async () => {
    await disconnectPrisma();
    logger.info("Server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import { requestLogger } from "./middleware/requestLogger";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { sanitizeBody } from "./middleware/sanitize";
import { requestId } from "./middleware/requestId";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import boardRoutes from "./routes/board.routes";
import columnRoutes from "./routes/column.routes";
import ticketRoutes from "./routes/ticket.routes";
import labelRoutes from "./routes/label.routes";
import commentRoutes from "./routes/comment.routes";

const app = express();

// ── Request ID ───────────────────────────────────────────────────────────────
app.use(requestId);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === "production",
    crossOriginEmbedderPolicy: env.NODE_ENV === "production",
  })
);

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ── Parsing and compression ───────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── Input sanitization ────────────────────────────────────────────────────────
app.use(sanitizeBody);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: process.env.npm_package_version });
});

// ── API Routes ────────────────────────────────────────────────────────────────
const API_PREFIX = "/api/v1";
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/boards`, boardRoutes);
app.use(`${API_PREFIX}/boards`, columnRoutes);
app.use(`${API_PREFIX}/tickets`, ticketRoutes);
app.use(`${API_PREFIX}/labels`, labelRoutes);
app.use(`${API_PREFIX}/tickets`, commentRoutes);

// ── 404 and error handling ────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

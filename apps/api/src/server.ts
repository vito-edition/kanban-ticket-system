import { createServer } from "http";
import { Server as SocketServer } from "socket.io";

import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { connectRedis, disconnectRedis } from "./config/redis";
import { registerSocketHandlers } from "./services/socket.service";

const httpServer = createServer(app);

export const io = new SocketServer(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

registerSocketHandlers(io);

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  httpServer.listen(env.API_PORT, () => {
    logger.info(`API server running on port ${env.API_PORT} [${env.NODE_ENV}]`);
  });
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  httpServer.close(async () => {
    await disconnectDatabase();
    await disconnectRedis();
    logger.info("Server closed");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason });
});

bootstrap().catch((err) => {
  logger.error("Bootstrap failed", { error: err.message });
  process.exit(1);
});

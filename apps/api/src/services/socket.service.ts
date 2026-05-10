import type { Server } from "socket.io";
import { logger } from "../config/logger";
import { verifyAccessToken } from "./token.service";

export function registerSocketHandlers(io: Server): void {
  io.use((socket, next) => {
    const token =
      socket.handshake.auth.token ??
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) return next(new Error("Authentication required"));

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.userEmail = payload.email;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    logger.debug("Socket connected", { userId: socket.data.userId, socketId: socket.id });

    socket.on("board:join", (boardId: string) => {
      socket.join(`board:${boardId}`);
      logger.debug("Socket joined board", { boardId, userId: socket.data.userId });
    });

    socket.on("board:leave", (boardId: string) => {
      socket.leave(`board:${boardId}`);
    });

    socket.on("disconnect", () => {
      logger.debug("Socket disconnected", { userId: socket.data.userId });
    });
  });
}

export function emitBoardUpdate(io: Server, boardId: string, event: string, data: unknown): void {
  io.to(`board:${boardId}`).emit(event, data);
}

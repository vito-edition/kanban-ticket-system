import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { logger } from "../config/logger";
import { error, badRequest, conflict } from "../utils/apiResponse";
import { env } from "../config/env";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error("AppError", { message: err.message, path: req.path, stack: err.stack });
    }
    return error(res, err.message, err.statusCode, err.errors);
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "root";
      errors[key] = errors[key] ?? [];
      errors[key].push(issue.message);
    }
    return badRequest(res, "Validation failed", errors);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const field = (err.meta?.target as string[])?.join(", ") ?? "field";
      return conflict(res, `${field} already exists`);
    }
    if (err.code === "P2025") {
      return error(res, "Record not found", 404);
    }
    logger.error("Prisma error", { code: err.code, meta: err.meta });
    return error(res, "Database error", 500);
  }

  logger.error("Unhandled error", {
    message: err.message,
    path: req.path,
    stack: env.NODE_ENV !== "production" ? err.stack : undefined,
  });

  return error(
    res,
    env.NODE_ENV === "production" ? "Internal server error" : err.message,
    500
  );
}

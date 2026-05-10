import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types";
import { verifyAccessToken } from "../services/token.service";
import { unauthorized, forbidden } from "../utils/apiResponse";

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    unauthorized(res, "No token provided");
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== "access") {
      unauthorized(res, "Invalid token type");
      return;
    }
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    unauthorized(res, "Invalid or expired token");
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      forbidden(res, "Insufficient permissions");
      return;
    }
    next();
  };
}

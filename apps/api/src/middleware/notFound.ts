import type { Request, Response } from "express";
import { error } from "../utils/apiResponse";

export function notFoundHandler(req: Request, res: Response): Response {
  return error(res, `Route ${req.method} ${req.path} not found`, 404);
}

import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types";

type AsyncFn<T extends Request = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function asyncHandler<T extends Request = Request>(fn: AsyncFn<T>) {
  return (req: T, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

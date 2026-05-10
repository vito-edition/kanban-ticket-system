import type { Response } from "express";
import type { ApiResponse, Pagination } from "../types";

export function success<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
}

export function created<T>(res: Response, data: T, message?: string): Response {
  return success(res, data, message, 201);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}

export function paginated<T>(
  res: Response,
  data: T[],
  pagination: Pagination
): Response {
  const body: ApiResponse<T[]> = { success: true, data, pagination };
  return res.status(200).json(body);
}

export function error(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: Record<string, string[]>
): Response {
  const body: ApiResponse = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

export function unauthorized(res: Response, message = "Unauthorized"): Response {
  return error(res, message, 401);
}

export function forbidden(res: Response, message = "Forbidden"): Response {
  return error(res, message, 403);
}

export function notFound(res: Response, message = "Resource not found"): Response {
  return error(res, message, 404);
}

export function badRequest(
  res: Response,
  message: string,
  errors?: Record<string, string[]>
): Response {
  return error(res, message, 400, errors);
}

export function conflict(res: Response, message: string): Response {
  return error(res, message, 409);
}

import type { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { success, notFound } from "../utils/apiResponse";
import type { AuthenticatedRequest } from "../types";
import { AppError } from "../middleware/errorHandler";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true, lastLoginAt: true },
    });
    if (!user) { notFound(res); return; }
    success(res, user);
  } catch (err) { next(err); }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });
    success(res, user, "Profile updated");
  } catch (err) { next(err); }
}

export async function listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user!.role !== "ADMIN" && req.user!.role !== "MANAGER") {
      throw new AppError("Forbidden", 403);
    }
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, isActive: true, createdAt: true },
      orderBy: { name: "asc" },
    });
    success(res, users);
  } catch (err) { next(err); }
}

export async function getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true },
    });
    if (!user) { notFound(res); return; }
    success(res, user);
  } catch (err) { next(err); }
}

import type { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { success, created, noContent, notFound } from "../utils/apiResponse";
import type { AuthenticatedRequest } from "../types";
import { AppError } from "../middleware/errorHandler";

const labelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
});

async function assertBoardMember(boardId: string, userId: string): Promise<void> {
  const member = await prisma.boardMember.findUnique({ where: { boardId_userId: { boardId, userId } } });
  if (!member) throw new AppError("Forbidden", 403);
}

export async function listLabels(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId } = req.query as { boardId: string };
    if (!boardId) throw new AppError("boardId query param required", 400);
    await assertBoardMember(boardId, req.user!.id);
    const labels = await prisma.label.findMany({ where: { boardId }, orderBy: { name: "asc" } });
    success(res, labels);
  } catch (err) { next(err); }
}

export async function createLabel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId } = req.body as { boardId: string };
    await assertBoardMember(boardId, req.user!.id);
    const { name, color } = labelSchema.parse(req.body);
    const label = await prisma.label.create({ data: { boardId, name, color } });
    created(res, label);
  } catch (err) { next(err); }
}

export async function updateLabel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { labelId } = req.params as { labelId: string };
    const existing = await prisma.label.findUnique({ where: { id: labelId } });
    if (!existing) { notFound(res); return; }
    await assertBoardMember(existing.boardId, req.user!.id);
    const data = labelSchema.partial().parse(req.body);
    const label = await prisma.label.update({ where: { id: labelId }, data });
    success(res, label);
  } catch (err) { next(err); }
}

export async function deleteLabel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { labelId } = req.params as { labelId: string };
    const existing = await prisma.label.findUnique({ where: { id: labelId } });
    if (!existing) { notFound(res); return; }
    await assertBoardMember(existing.boardId, req.user!.id);
    await prisma.label.delete({ where: { id: labelId } });
    noContent(res);
  } catch (err) { next(err); }
}

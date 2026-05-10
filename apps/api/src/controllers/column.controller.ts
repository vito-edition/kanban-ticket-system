import type { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { success, created, noContent, notFound } from "../utils/apiResponse";
import type { AuthenticatedRequest } from "../types";
import { AppError } from "../middleware/errorHandler";

async function assertBoardMember(boardId: string, userId: string): Promise<void> {
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  if (!member) throw new AppError("Forbidden", 403);
}

const createColumnSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  wipLimit: z.number().int().positive().optional(),
});

const updateColumnSchema = createColumnSchema.partial();

const reorderSchema = z.object({
  columns: z.array(z.object({ id: z.string().uuid(), position: z.number().int().min(0) })).min(1),
});

export async function listColumns(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId } = req.params as { boardId: string };
    await assertBoardMember(boardId, req.user!.id);
    const columns = await prisma.column.findMany({
      where: { boardId },
      orderBy: { position: "asc" },
      include: { _count: { select: { tickets: true } } },
    });
    success(res, columns);
  } catch (err) {
    next(err);
  }
}

export async function createColumn(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId } = req.params as { boardId: string };
    await assertBoardMember(boardId, req.user!.id);
    const data = createColumnSchema.parse(req.body);

    const maxPos = await prisma.column.aggregate({ where: { boardId }, _max: { position: true } });
    const position = (maxPos._max.position ?? -1) + 1;

    const column = await prisma.column.create({ data: { ...data, boardId, position } });
    created(res, column, "Column created");
  } catch (err) {
    next(err);
  }
}

export async function updateColumn(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId, columnId } = req.params as { boardId: string; columnId: string };
    await assertBoardMember(boardId, req.user!.id);

    const existing = await prisma.column.findFirst({ where: { id: columnId, boardId } });
    if (!existing) { notFound(res); return; }

    const data = updateColumnSchema.parse(req.body);
    const column = await prisma.column.update({ where: { id: columnId }, data });
    success(res, column);
  } catch (err) {
    next(err);
  }
}

export async function deleteColumn(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId, columnId } = req.params as { boardId: string; columnId: string };
    await assertBoardMember(boardId, req.user!.id);

    const existing = await prisma.column.findFirst({ where: { id: columnId, boardId } });
    if (!existing) { notFound(res); return; }

    const ticketCount = await prisma.ticket.count({ where: { columnId } });
    if (ticketCount > 0) {
      throw new AppError("Cannot delete a column that contains tickets. Move or delete them first.", 409);
    }

    await prisma.column.delete({ where: { id: columnId } });
    noContent(res);
  } catch (err) {
    next(err);
  }
}

export async function reorderColumns(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId } = req.params as { boardId: string };
    await assertBoardMember(boardId, req.user!.id);
    const { columns } = reorderSchema.parse(req.body);

    await prisma.$transaction(
      columns.map(({ id, position }) =>
        prisma.column.update({ where: { id, boardId }, data: { position } })
      )
    );

    const updated = await prisma.column.findMany({
      where: { boardId },
      orderBy: { position: "asc" },
    });
    success(res, updated);
  } catch (err) {
    next(err);
  }
}

import type { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { success, created, noContent, notFound, forbidden, badRequest } from "../utils/apiResponse";
import type { AuthenticatedRequest } from "../types";
import { AppError } from "../middleware/errorHandler";

const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isPublic: z.boolean().optional(),
});

const updateBoardSchema = createBoardSchema.partial();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base);
  let counter = 0;
  while (true) {
    const candidate = counter === 0 ? slug : `${slug}-${counter}`;
    const existing = await prisma.board.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    counter++;
  }
}

async function assertBoardAccess(
  boardId: string,
  userId: string,
  minRole: "VIEWER" | "MEMBER" | "ADMIN" | "OWNER" = "VIEWER"
): Promise<void> {
  const roles = ["VIEWER", "MEMBER", "ADMIN", "OWNER"];
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  if (!member || roles.indexOf(member.role) < roles.indexOf(minRole)) {
    throw new AppError("Forbidden", 403);
  }
}

export async function listBoards(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const boards = await prisma.board.findMany({
      where: {
        members: { some: { userId: req.user!.id } },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        _count: { select: { tickets: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    success(res, boards);
  } catch (err) {
    next(err);
  }
}

export async function createBoard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createBoardSchema.parse(req.body);
    const slug = await uniqueSlug(data.name);

    const board = await prisma.$transaction(async (tx) => {
      const b = await tx.board.create({
        data: { ...data, slug },
      });

      await tx.boardMember.create({
        data: { boardId: b.id, userId: req.user!.id, role: "OWNER" },
      });

      await tx.column.createMany({
        data: [
          { boardId: b.id, name: "Backlog", position: 0 },
          { boardId: b.id, name: "To Do", position: 1, isDefault: true },
          { boardId: b.id, name: "In Progress", position: 2, wipLimit: 5 },
          { boardId: b.id, name: "Done", position: 3 },
        ],
      });

      return tx.board.findUnique({
        where: { id: b.id },
        include: { columns: { orderBy: { position: "asc" } }, members: true },
      });
    });

    created(res, board, "Board created");
  } catch (err) {
    next(err);
  }
}

export async function getBoard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId } = req.params as { boardId: string };
    await assertBoardAccess(boardId, req.user!.id);

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: { position: "asc" },
          include: {
            tickets: {
              where: { isArchived: false },
              orderBy: { position: "asc" },
              include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                labels: { include: { label: true } },
                _count: { select: { comments: true, attachments: true } },
              },
            },
          },
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        labels: true,
      },
    });

    if (!board) { notFound(res); return; }
    success(res, board);
  } catch (err) {
    next(err);
  }
}

export async function updateBoard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId } = req.params as { boardId: string };
    await assertBoardAccess(boardId, req.user!.id, "ADMIN");

    const data = updateBoardSchema.parse(req.body);
    const slug = data.name ? await uniqueSlug(data.name, boardId) : undefined;

    const board = await prisma.board.update({
      where: { id: boardId },
      data: { ...data, ...(slug && { slug }) },
    });
    success(res, board);
  } catch (err) {
    next(err);
  }
}

export async function deleteBoard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId } = req.params as { boardId: string };
    await assertBoardAccess(boardId, req.user!.id, "OWNER");
    await prisma.board.delete({ where: { id: boardId } });
    noContent(res);
  } catch (err) {
    next(err);
  }
}

export async function addBoardMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId } = req.params as { boardId: string };
    await assertBoardAccess(boardId, req.user!.id, "ADMIN");

    const schema = z.object({
      userId: z.string().uuid(),
      role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
    });
    const { userId, role } = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { notFound(res, "User not found"); return; }

    const member = await prisma.boardMember.upsert({
      where: { boardId_userId: { boardId, userId } },
      create: { boardId, userId, role },
      update: { role },
    });
    created(res, member, "Member added");
  } catch (err) {
    next(err);
  }
}

export async function removeBoardMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { boardId, userId } = req.params as { boardId: string; userId: string };
    await assertBoardAccess(boardId, req.user!.id, "ADMIN");

    const target = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });
    if (!target) { notFound(res, "Member not found"); return; }
    if (target.role === "OWNER") {
      badRequest(res, "Cannot remove board owner");
      return;
    }

    await prisma.boardMember.delete({ where: { boardId_userId: { boardId, userId } } });
    noContent(res);
  } catch (err) {
    next(err);
  }
}

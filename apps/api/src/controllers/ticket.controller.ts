import type { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import {
  success, created, noContent, notFound, badRequest, paginated,
} from "../utils/apiResponse";
import type { AuthenticatedRequest, Pagination } from "../types";
import { AppError } from "../middleware/errorHandler";

const SLA_HOURS: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168,
};

function computeSlaDeadline(priority: string, createdAt: Date = new Date()): Date {
  const hours = SLA_HOURS[priority] ?? 72;
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}

async function assertBoardMember(boardId: string, userId: string): Promise<void> {
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  if (!member) throw new AppError("Forbidden", 403);
}

const createTicketSchema = z.object({
  boardId: z.string().uuid(),
  columnId: z.string().uuid(),
  title: z.string().min(1).max(250),
  description: z.string().max(10000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  storyPoints: z.number().int().min(0).max(100).optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

const updateTicketSchema = z.object({
  title: z.string().min(1).max(250).optional(),
  description: z.string().max(10000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  storyPoints: z.number().int().min(0).max(100).nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
});

const moveTicketSchema = z.object({
  columnId: z.string().uuid(),
  position: z.number().int().min(0),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  boardId: z.string().uuid().optional(),
  columnId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).optional(),
  slaBreached: z.coerce.boolean().optional(),
  search: z.string().max(200).optional(),
});

export async function listTickets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = listQuerySchema.parse(req.query);
    const { page, limit, boardId, columnId, assigneeId, priority, status, slaBreached, search } = query;

    if (boardId) await assertBoardMember(boardId, req.user!.id);

    const where = {
      ...(boardId && { boardId }),
      ...(columnId && { columnId }),
      ...(assigneeId && { assigneeId }),
      ...(priority && { priority }),
      ...(status && { status }),
      ...(slaBreached !== undefined && { slaBreached }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      isArchived: false,
      ...(boardId ? {} : {
        board: { members: { some: { userId: req.user!.id } } },
      }),
    };

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          creator: { select: { id: true, name: true } },
          labels: { include: { label: true } },
          column: { select: { id: true, name: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy: [{ columnId: "asc" }, { position: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    const pagination: Pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    paginated(res, tickets, pagination);
  } catch (err) {
    next(err);
  }
}

export async function createTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createTicketSchema.parse(req.body);
    await assertBoardMember(data.boardId, req.user!.id);

    const column = await prisma.column.findFirst({ where: { id: data.columnId, boardId: data.boardId } });
    if (!column) { badRequest(res, "Column does not belong to this board"); return; }

    const maxPos = await prisma.ticket.aggregate({ where: { columnId: data.columnId }, _max: { position: true } });
    const position = (maxPos._max.position ?? -1) + 1;

    const slaDeadline = computeSlaDeadline(data.priority);

    const { labelIds, dueDate, ...rest } = data;

    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.ticket.create({
        data: {
          ...rest,
          creatorId: req.user!.id,
          position,
          slaDeadline,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          ...(labelIds?.length && {
            labels: { create: labelIds.map((labelId) => ({ labelId })) },
          }),
        },
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          labels: { include: { label: true } },
          creator: { select: { id: true, name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          ticketId: t.id,
          action: "CREATED",
          entityType: "Ticket",
          entityId: t.id,
          newValue: { title: t.title, priority: t.priority, columnId: t.columnId },
        },
      });

      return t;
    });

    created(res, ticket, "Ticket created");
  } catch (err) {
    next(err);
  }
}

export async function getTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticketId } = req.params as { ticketId: string };
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        board: { select: { id: true, name: true } },
        column: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        labels: { include: { label: true } },
        comments: {
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: "asc" },
        },
        attachments: true,
        auditLogs: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!ticket) { notFound(res); return; }
    await assertBoardMember(ticket.boardId, req.user!.id);
    success(res, ticket);
  } catch (err) {
    next(err);
  }
}

export async function updateTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticketId } = req.params as { ticketId: string };

    const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!existing) { notFound(res); return; }
    await assertBoardMember(existing.boardId, req.user!.id);

    const data = updateTicketSchema.parse(req.body);
    const { labelIds, dueDate, ...rest } = data;

    const newSlaDeadline =
      data.priority && data.priority !== existing.priority
        ? computeSlaDeadline(data.priority, existing.createdAt)
        : undefined;

    const ticket = await prisma.$transaction(async (tx) => {
      if (labelIds !== undefined) {
        await tx.ticketLabel.deleteMany({ where: { ticketId } });
        if (labelIds.length > 0) {
          await tx.ticketLabel.createMany({
            data: labelIds.map((labelId) => ({ ticketId, labelId })),
          });
        }
      }

      const t = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          ...rest,
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(newSlaDeadline && { slaDeadline: newSlaDeadline }),
        },
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          labels: { include: { label: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          ticketId,
          action: "UPDATED",
          entityType: "Ticket",
          entityId: ticketId,
          oldValue: { title: existing.title, priority: existing.priority },
          newValue: rest,
        },
      });

      return t;
    });

    success(res, ticket);
  } catch (err) {
    next(err);
  }
}

export async function moveTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticketId } = req.params as { ticketId: string };
    const { columnId, position } = moveTicketSchema.parse(req.body);

    const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!existing) { notFound(res); return; }
    await assertBoardMember(existing.boardId, req.user!.id);

    const targetColumn = await prisma.column.findFirst({ where: { id: columnId, boardId: existing.boardId } });
    if (!targetColumn) { badRequest(res, "Target column not found in this board"); return; }

    // Check WIP limit
    if (targetColumn.wipLimit && columnId !== existing.columnId) {
      const currentCount = await prisma.ticket.count({ where: { columnId, isArchived: false } });
      if (currentCount >= targetColumn.wipLimit) {
        throw new AppError(`Column "${targetColumn.name}" has reached its WIP limit of ${targetColumn.wipLimit}`, 409);
      }
    }

    await prisma.$transaction(async (tx) => {
      // Make room at target position
      await tx.ticket.updateMany({
        where: { columnId, position: { gte: position }, id: { not: ticketId } },
        data: { position: { increment: 1 } },
      });

      const now = new Date();
      const statusUpdate =
        columnId !== existing.columnId
          ? {
              startedAt: !existing.startedAt ? now : existing.startedAt,
              completedAt: targetColumn.name === "Done" ? now : null,
              status: targetColumn.name === "Done" ? "DONE" as const : "IN_PROGRESS" as const,
            }
          : {};

      await tx.ticket.update({
        where: { id: ticketId },
        data: { columnId, position, ...statusUpdate },
      });

      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          ticketId,
          action: "MOVED",
          entityType: "Ticket",
          entityId: ticketId,
          oldValue: { columnId: existing.columnId, position: existing.position },
          newValue: { columnId, position },
        },
      });
    });

    const updated = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { column: true, assignee: { select: { id: true, name: true, avatarUrl: true } } },
    });
    success(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticketId } = req.params as { ticketId: string };
    const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!existing) { notFound(res); return; }
    await assertBoardMember(existing.boardId, req.user!.id);

    await prisma.ticket.delete({ where: { id: ticketId } });
    noContent(res);
  } catch (err) {
    next(err);
  }
}

export async function archiveTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticketId } = req.params as { ticketId: string };
    const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!existing) { notFound(res); return; }
    await assertBoardMember(existing.boardId, req.user!.id);

    await prisma.ticket.update({ where: { id: ticketId }, data: { isArchived: true } });
    success(res, null, "Ticket archived");
  } catch (err) {
    next(err);
  }
}

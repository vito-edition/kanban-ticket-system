import type { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/database";
import { success, created, noContent, notFound, forbidden } from "../utils/apiResponse";
import type { AuthenticatedRequest } from "../types";
import { AppError } from "../middleware/errorHandler";

async function assertTicketAccess(ticketId: string, userId: string): Promise<{ id: string; boardId: string }> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { board: { include: { members: { where: { userId } } } } },
  });
  if (!ticket) throw new AppError("Ticket not found", 404);
  if (!ticket.board.members.length) throw new AppError("Forbidden", 403);
  return ticket;
}

const commentSchema = z.object({
  content: z.string().min(1).max(5000).trim(),
});

export async function listComments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticketId } = req.params as { ticketId: string };
    await assertTicketAccess(ticketId, req.user!.id);

    const comments = await prisma.comment.findMany({
      where: { ticketId },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });
    success(res, comments);
  } catch (err) {
    next(err);
  }
}

export async function createComment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticketId } = req.params as { ticketId: string };
    await assertTicketAccess(ticketId, req.user!.id);

    const { content } = commentSchema.parse(req.body);
    const comment = await prisma.comment.create({
      data: { ticketId, authorId: req.user!.id, content },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
    created(res, comment);
  } catch (err) {
    next(err);
  }
}

export async function updateComment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticketId, commentId } = req.params as { ticketId: string; commentId: string };
    await assertTicketAccess(ticketId, req.user!.id);

    const existing = await prisma.comment.findFirst({ where: { id: commentId, ticketId } });
    if (!existing) { notFound(res); return; }
    if (existing.authorId !== req.user!.id && req.user!.role !== "ADMIN") {
      forbidden(res, "You can only edit your own comments");
      return;
    }

    const { content } = commentSchema.parse(req.body);
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { content, isEdited: true },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
    success(res, comment);
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ticketId, commentId } = req.params as { ticketId: string; commentId: string };
    await assertTicketAccess(ticketId, req.user!.id);

    const existing = await prisma.comment.findFirst({ where: { id: commentId, ticketId } });
    if (!existing) { notFound(res); return; }
    if (existing.authorId !== req.user!.id && req.user!.role !== "ADMIN") {
      forbidden(res, "You can only delete your own comments");
      return;
    }

    await prisma.comment.delete({ where: { id: commentId } });
    noContent(res);
  } catch (err) {
    next(err);
  }
}

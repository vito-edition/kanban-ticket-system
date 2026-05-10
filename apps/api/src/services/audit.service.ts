import { prisma } from "../config/database";

interface AuditEntry {
  userId?: string;
  ticketId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({ data: entry });
}

export async function getTicketAuditLog(ticketId: string, limit = 50) {
  return prisma.auditLog.findMany({
    where: { ticketId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

import { prisma } from "../config/database";
import { logger } from "../config/logger";

export async function checkAndBreachSlas(): Promise<void> {
  const now = new Date();
  const result = await prisma.ticket.updateMany({
    where: {
      slaDeadline: { lt: now },
      slaBreached: false,
      status: { notIn: ["DONE", "CANCELLED"] },
      isArchived: false,
    },
    data: { slaBreached: true },
  });

  if (result.count > 0) {
    logger.warn(`SLA breached for ${result.count} tickets`);
  }
}

export function startSlaChecker(intervalMs = 5 * 60 * 1000): NodeJS.Timeout {
  logger.info("SLA checker started");
  return setInterval(async () => {
    try {
      await checkAndBreachSlas();
    } catch (err) {
      logger.error("SLA checker error", { error: (err as Error).message });
    }
  }, intervalMs);
}

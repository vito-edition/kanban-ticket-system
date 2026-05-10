import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/config/database", () => ({
  prisma: {
    ticket: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

vi.mock("../../src/config/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { checkAndBreachSlas } from "../../src/services/sla.service";
import { prisma } from "../../src/config/database";

describe("SLA Service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls ticket.updateMany with slaDeadline lt now and slaBreached false", async () => {
    await checkAndBreachSlas();
    expect(prisma.ticket.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ slaBreached: false }),
        data: { slaBreached: true },
      })
    );
  });

  it("does not throw when no tickets are breached", async () => {
    await expect(checkAndBreachSlas()).resolves.not.toThrow();
  });
});

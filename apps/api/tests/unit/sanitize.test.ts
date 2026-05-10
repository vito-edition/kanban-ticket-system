import { describe, it, expect, vi } from "vitest";
import { sanitizeBody } from "../../src/middleware/sanitize";
import type { Request, Response, NextFunction } from "express";

function mockReq(body: unknown): Request {
  return { body } as Request;
}

describe("Sanitize Middleware", () => {
  it("strips script tags from string values", () => {
    const req = mockReq({ title: '<script>alert("xss")</script>Clean' });
    const next = vi.fn() as NextFunction;
    sanitizeBody(req, {} as Response, next);
    expect((req.body as Record<string, string>).title).not.toContain("<script>");
    expect(next).toHaveBeenCalled();
  });

  it("sanitizes nested objects", () => {
    const req = mockReq({ nested: { value: "<script>bad</script>good" } });
    const next = vi.fn() as NextFunction;
    sanitizeBody(req, {} as Response, next);
    expect((req.body as Record<string, Record<string, string>>).nested.value).not.toContain("<script>");
  });

  it("sanitizes arrays", () => {
    const req = mockReq({ items: ["<script>x</script>ok", "safe"] });
    const next = vi.fn() as NextFunction;
    sanitizeBody(req, {} as Response, next);
    const items = (req.body as Record<string, string[]>).items;
    expect(items[0]).not.toContain("<script>");
    expect(items[1]).toBe("safe");
  });

  it("passes non-string values unchanged", () => {
    const req = mockReq({ count: 42, active: true, data: null });
    const next = vi.fn() as NextFunction;
    sanitizeBody(req, {} as Response, next);
    expect((req.body as Record<string, unknown>).count).toBe(42);
    expect(next).toHaveBeenCalled();
  });

  it("always calls next", () => {
    const req = mockReq({});
    const next = vi.fn() as NextFunction;
    sanitizeBody(req, {} as Response, next);
    expect(next).toHaveBeenCalled();
  });
});

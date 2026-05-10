import { describe, it, expect, vi } from "vitest";
import { success, error, badRequest, notFound, unauthorized, conflict, created, paginated } from "../../src/utils/apiResponse";

function mockRes() {
  const res: Record<string, unknown> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res as unknown as import("express").Response;
}

describe("API Response Utils", () => {
  it("success returns 200 with data", () => {
    const res = mockRes();
    success(res, { id: "1" }, "OK");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "1" }, message: "OK" });
  });

  it("created returns 201", () => {
    const res = mockRes();
    created(res, { id: "1" });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("error returns correct status and body", () => {
    const res = mockRes();
    error(res, "Oops", 500);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Oops" }));
  });

  it("badRequest returns 400 with errors", () => {
    const res = mockRes();
    badRequest(res, "Invalid", { email: ["Required"] });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors: { email: ["Required"] } }));
  });

  it("unauthorized returns 401", () => {
    const res = mockRes();
    unauthorized(res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("notFound returns 404", () => {
    const res = mockRes();
    notFound(res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("conflict returns 409", () => {
    const res = mockRes();
    conflict(res, "Already exists");
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("paginated includes pagination metadata", () => {
    const res = mockRes();
    paginated(res, [1, 2, 3], { page: 1, limit: 20, total: 3, totalPages: 1 });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      pagination: expect.objectContaining({ total: 3 }),
    }));
  });
});

import { describe, it, expect } from "vitest";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateRefreshTokenHash,
} from "../../src/services/token.service";

describe("Token Service", () => {
  const payload = { sub: "user-123", email: "test@example.com", role: "MEMBER" };

  it("generates and verifies access tokens", () => {
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.type).toBe("access");
  });

  it("generates and verifies refresh tokens", () => {
    const token = generateRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.type).toBe("refresh");
  });

  it("throws when verifying access token with refresh secret", () => {
    const access = generateAccessToken(payload);
    expect(() => verifyRefreshToken(access)).toThrow();
  });

  it("throws when verifying refresh token with access secret", () => {
    const refresh = generateRefreshToken(payload);
    expect(() => verifyAccessToken(refresh)).toThrow();
  });

  it("generates consistent hash for the same token", () => {
    const hash1 = generateRefreshTokenHash("some-token");
    const hash2 = generateRefreshTokenHash("some-token");
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("generates different hashes for different tokens", () => {
    const h1 = generateRefreshTokenHash("token-a");
    const h2 = generateRefreshTokenHash("token-b");
    expect(h1).not.toBe(h2);
  });
});

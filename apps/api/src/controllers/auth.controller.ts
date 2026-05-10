import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/database";
import { env } from "../config/env";
import {
  generateAccessToken,
  generateRefreshToken,
  generateRefreshTokenHash,
  verifyRefreshToken,
} from "../services/token.service";
import {
  success,
  created,
  unauthorized,
  conflict,
  badRequest,
} from "../utils/apiResponse";
import type { AuthenticatedRequest } from "../types";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setRefreshCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie("refreshToken", { path: "/api/v1/auth" });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      conflict(res, "Email already registered");
      return;
    }

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const tokenPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: generateRefreshTokenHash(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, refreshToken);
    created(res, { user, accessToken }, "Account created successfully");
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      unauthorized(res, "Invalid credentials");
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      unauthorized(res, "Invalid credentials");
      return;
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const tokenPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: generateRefreshTokenHash(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, refreshToken);
    success(res, {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
    if (!token) {
      unauthorized(res, "Refresh token required");
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      clearRefreshCookie(res);
      unauthorized(res, "Invalid or expired refresh token");
      return;
    }

    if (payload.type !== "refresh") {
      clearRefreshCookie(res);
      unauthorized(res, "Invalid token type");
      return;
    }

    const tokenHash = generateRefreshTokenHash(token);
    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash, userId: payload.sub, revoked: false },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      clearRefreshCookie(res);
      unauthorized(res, "Refresh token expired or revoked");
      return;
    }

    // Rotate refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const newPayload = { sub: storedToken.user.id, email: storedToken.user.email, role: storedToken.user.role };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: generateRefreshTokenHash(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, newRefreshToken);
    success(res, { accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
    if (token) {
      const tokenHash = generateRefreshTokenHash(token);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, userId: req.user?.id },
        data: { revoked: true },
      });
    }
    clearRefreshCookie(res);
    success(res, null, "Logged out successfully");
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return;
    await prisma.refreshToken.updateMany({
      where: { userId: req.user.id },
      data: { revoked: true },
    });
    clearRefreshCookie(res);
    success(res, null, "All sessions terminated");
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true, lastLoginAt: true },
    });
    if (!user) {
      unauthorized(res, "User not found");
      return;
    }
    success(res, user);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8)
        .regex(/[A-Z]/, "Must contain uppercase")
        .regex(/[0-9]/, "Must contain number"),
    });
    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      unauthorized(res);
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      badRequest(res, "Current password is incorrect");
      return;
    }

    const newHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } }),
      prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { revoked: true } }),
    ]);

    clearRefreshCookie(res);
    success(res, null, "Password changed. Please log in again.");
  } catch (err) {
    next(err);
  }
}

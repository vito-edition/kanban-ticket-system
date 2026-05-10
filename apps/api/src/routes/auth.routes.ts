import { Router } from "express";
import { authRateLimiter } from "../middleware/rateLimiter";
import { authenticate } from "../middleware/authenticate";
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
  changePassword,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.post("/logout-all", authenticate, logoutAll);
router.get("/me", authenticate, me);
router.patch("/change-password", authenticate, changePassword);

export default router;

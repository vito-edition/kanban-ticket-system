import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { getProfile, updateProfile, listUsers, getUserById } from "../controllers/user.controller";

const router = Router();
router.use(authenticate);

router.get("/", listUsers);
router.get("/me", getProfile);
router.patch("/me", updateProfile);
router.get("/:userId", getUserById);

export default router;

import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { listLabels, createLabel, updateLabel, deleteLabel } from "../controllers/label.controller";

const router = Router();
router.use(authenticate);

router.get("/", listLabels);
router.post("/", createLabel);
router.patch("/:labelId", updateLabel);
router.delete("/:labelId", deleteLabel);

export default router;

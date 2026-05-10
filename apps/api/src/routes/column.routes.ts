import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  listColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from "../controllers/column.controller";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/:boardId/columns", listColumns);
router.post("/:boardId/columns", createColumn);
router.patch("/:boardId/columns/:columnId", updateColumn);
router.delete("/:boardId/columns/:columnId", deleteColumn);
router.patch("/:boardId/columns/reorder", reorderColumns);

export default router;

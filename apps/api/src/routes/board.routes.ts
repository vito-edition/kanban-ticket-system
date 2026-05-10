import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  listBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  addBoardMember,
  removeBoardMember,
} from "../controllers/board.controller";

const router = Router();

router.use(authenticate);

router.get("/", listBoards);
router.post("/", createBoard);
router.get("/:boardId", getBoard);
router.patch("/:boardId", updateBoard);
router.delete("/:boardId", deleteBoard);
router.post("/:boardId/members", addBoardMember);
router.delete("/:boardId/members/:userId", removeBoardMember);

export default router;

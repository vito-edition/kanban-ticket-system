import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { listComments, createComment, updateComment, deleteComment } from "../controllers/comment.controller";

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get("/:ticketId/comments", listComments);
router.post("/:ticketId/comments", createComment);
router.patch("/:ticketId/comments/:commentId", updateComment);
router.delete("/:ticketId/comments/:commentId", deleteComment);

export default router;

import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  listTickets, createTicket, getTicket, updateTicket,
  moveTicket, deleteTicket, archiveTicket,
} from "../controllers/ticket.controller";

const router = Router();
router.use(authenticate);

router.get("/", listTickets);
router.post("/", createTicket);
router.get("/:ticketId", getTicket);
router.patch("/:ticketId", updateTicket);
router.patch("/:ticketId/move", moveTicket);
router.patch("/:ticketId/archive", archiveTicket);
router.delete("/:ticketId", deleteTicket);

export default router;

import { Router } from "express";
import {
  acceptBid,
  acceptErrand,
  createErrand,
  declineBid,
  getErrandById,
  getPostedErrands,
  submitBid,
  updateErrandStatus,
} from "../controllers/errand";
import { requireRole } from "../middleware/role";

const router = Router();

router.post("/create", requireRole("requester"), createErrand);
router.get("/posted", requireRole("helper"), getPostedErrands);

router.post("/:id/accept", requireRole("helper"), acceptErrand);

router.get("/:id", getErrandById);
router.post("/:id/bids", requireRole("helper"), submitBid);
router.patch("/:id/bids/:bidId/decline", requireRole("requester"), declineBid);
router.patch("/:id/bids/:bidId/accept", requireRole("requester"), acceptBid);
router.patch("/:id/status", updateErrandStatus);

export default router;

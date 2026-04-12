import { Router } from "express";
import {
  acceptOffer,
  acceptErrand,
  createErrand,
  declineOffer,
  getErrandById,
  getPostedErrands,
  submitOffer,
  updateErrandStatus,
} from "../controllers/errand";
import { requireRole } from "../middleware/role";

const router = Router();

router.post("/create", requireRole("requester"), createErrand);
router.get("/posted", requireRole("helper"), getPostedErrands);

router.post("/:id/accept", requireRole("helper"), acceptErrand);

router.get("/:id", getErrandById);
router.post("/:id/offers", requireRole("helper"), submitOffer);
router.patch("/:id/offers/:offerId/decline", requireRole("requester"), declineOffer);
router.patch("/:id/offers/:offerId/accept", requireRole("requester"), acceptOffer);
router.patch("/:id/status", updateErrandStatus);

export default router;

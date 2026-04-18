import { Router } from "express";
import {
  createErrand,
  extendWork,
  getErrandById,
  raiseDispute,
  setPaymentMethod,
  startWork,
  updateErrandStatus,
} from "../controllers/errand";
import { requireRole } from "../middleware/role";

const router = Router();

router.post("/create", requireRole("requester"), createErrand);

router.patch("/:id/start", requireRole("helper"), startWork);
router.patch("/:id/extend", requireRole("helper"), extendWork);
router.patch("/:id/payment-method", requireRole("requester"), setPaymentMethod);

router.get("/:id", getErrandById);
router.patch("/:id/status", updateErrandStatus);
router.post("/:id/dispute", requireRole("requester"), raiseDispute);

export default router;

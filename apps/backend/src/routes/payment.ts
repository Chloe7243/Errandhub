import { Router } from "express";
import {
  createPaymentIntent,
  deletePaymentMethod,
  getPaymentMethods,
} from "../controllers/payment";
import { requireRole } from "../middleware/role";

const router = Router();

// Payment endpoints are requester-only — helpers are payees and don't need
// card management in this flow (payouts are handled out of band).
router.get("/methods", requireRole("requester"), getPaymentMethods);
router.post("/setup-intent", requireRole("requester"), createPaymentIntent);
router.delete(
  "/methods/:methodId",
  requireRole("requester"),
  deletePaymentMethod,
);

export default router;

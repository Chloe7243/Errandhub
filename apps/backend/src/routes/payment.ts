import { Router } from "express";
import {
  createPaymentIntent,
  deletePaymentMethod,
  getPaymentMethods,
} from "../controllers/payment";
import { requireRole } from "../middleware/role";

const router = Router();

router.get("/methods", requireRole("requester"), getPaymentMethods);
router.post("/setup-intent", requireRole("requester"), createPaymentIntent);
router.delete(
  "/methods/:methodId",
  requireRole("requester"),
  deletePaymentMethod,
);

export default router;

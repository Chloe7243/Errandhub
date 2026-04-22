import { Router } from "express";
import {
  createErrand,
  extendWork,
  getErrandById,
  raiseDispute,
  startWork,
  updateErrandStatus,
} from "../controllers/errand";
import { requireRole } from "../middleware/role";

const router = Router();

// Errand lifecycle endpoints. Role guards are applied per-route because
// requesters and helpers drive different transitions on the same errand.
router.post("/create", requireRole("requester"), createErrand);

// Helper-only transitions during an in-progress hands-on-help errand.
router.patch("/:id/start", requireRole("helper"), startWork);
router.patch("/:id/extend", requireRole("helper"), extendWork);

// Shared transitions (fetch / status bumps) — controller enforces any finer
// ownership checks. Disputes are requester-initiated only.
router.get("/:id", getErrandById);
router.patch("/:id/status", updateErrandStatus);
router.post("/:id/dispute", requireRole("requester"), raiseDispute);

export default router;

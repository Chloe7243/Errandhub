import { Router } from "express";
import {
  getRequestedErrands,
  getHelpedErrands,
  updateSettings,
  updateAvatar,
  getSettings,
  getUser,
  savePushToken,
  deleteAccount,
} from "../controllers/user";
import { requireRole } from "../middleware/role";

const router = Router();

// Profile and settings endpoints. The two /-errands endpoints are split by
// role because the returned shape (requester vs helper view) and the
// summary aggregates differ.
router.get("/me", getUser);
router.delete("/me", deleteAccount);
router.patch("/avatar", updateAvatar);
router.post("/push-token", savePushToken);
router.get("/settings", getSettings);
router.patch("/update-settings", updateSettings);
router.get("/helped-errands", requireRole("helper"), getHelpedErrands);
router.get("/requested-errands", requireRole("requester"), getRequestedErrands);

export default router;

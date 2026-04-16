import { Router } from "express";
import {
  getRequestedErrands,
  getHelpedErrands,
  updateSettings,
  getSettings,
  getUser,
  savePushToken,
} from "../controllers/user";
import { requireRole } from "../middleware/role";

const router = Router();

router.get("/me", getUser);
router.post("/push-token", savePushToken);
router.get("/settings", getSettings);
router.patch("/update-settings", updateSettings);
router.get("/helped-errands", requireRole("helper"), getHelpedErrands);
router.get("/requested-errands", requireRole("requester"), getRequestedErrands);

export default router;

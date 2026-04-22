import { Router } from "express";
import {
  signUp,
  login,
  resetPassword,
  selectRole,
  forgetPassword,
} from "../controllers/auth";

const router = Router();

// Public auth endpoints — mounted in index.ts before authMiddleware so they
// can be hit without a JWT. selectRole intentionally takes the userId via
// URL param because it runs during first-time onboarding when the client
// has a user record but has not yet chosen a role to receive a token for.
router.post("/login", login);
router.post("/signup", signUp);
router.post("/reset-password", resetPassword);
router.post("/forget-password", forgetPassword);
router.post("/select-role/:userId", selectRole);

export default router;

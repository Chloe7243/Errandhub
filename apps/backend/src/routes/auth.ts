import { Router } from "express";
import {
  signUp,
  login,
  resetPassword,
  selectRole,
  forgetPassword,
} from "../controllers/auth";

const router = Router();

router.post("/login", login);
router.post("/signup", signUp);
router.post("/reset-password", resetPassword);
router.post("/forget-password", forgetPassword);
router.post("/select-role/:userId", selectRole);

export default router;

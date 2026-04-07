import { Router } from "express";
import { getUser } from "../controllers/user";

const router = Router();

router.get("/get-user/:userId", getUser);

export default router;

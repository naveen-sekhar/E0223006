import { Router } from "express";
import { handleRegister, handleGetToken } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", handleRegister);
router.post("/token", handleGetToken);

export default router;

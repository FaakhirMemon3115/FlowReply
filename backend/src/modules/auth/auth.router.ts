// src/modules/auth/auth.router.ts
import { Router } from "express";
import { register, login, refreshToken, logout } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

export default router;

// src/modules/business/business.router.ts
import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Business router stub" });
});

export default router;

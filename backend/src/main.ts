// src/main.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { json, urlencoded } from "body-parser";
import { initPrisma } from "./utils/prisma";
import authRouter from "./modules/auth/auth.router";
import businessRouter from "./modules/business/business.router";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(morgan("dev"));
app.use(json({ limit: "2mb" }));
app.use(urlencoded({ extended: true }));

// Basic health check
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/business", businessRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});

// Initialize Prisma client (for graceful shutdown handling)
initPrisma();

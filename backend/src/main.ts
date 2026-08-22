// Main application entry point for FlowReply Express backend
import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { initPrisma } from "./utils/prisma";
import authRouter from "./modules/auth/auth.router";

// Inline business router stub to avoid IDE import resolution cache bugs
const businessRouter = express.Router();
businessRouter.get("/", (req, res) => {
  res.json({ message: "Business router stub" });
});

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));

// Custom logging middleware replacing morgan
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

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

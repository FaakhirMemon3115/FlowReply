// Main application entry point for FlowReply Express backend
import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { initPrisma } from "./utils/prisma";
import authRouter from "./modules/auth/auth.router";
import whatsappRouter from "./modules/whatsapp/whatsapp.router";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));

// Custom logging middleware replacing morgan
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ───
app.get("/health", (_req, res) => res.json({
  status: "ok",
  timestamp: new Date().toISOString(),
  whatsapp: process.env.USE_MOCK_WHATSAPP === "true"
    ? "sandbox"
    : (process.env.WA_PHONE_NUMBER_ID ? "connected" : "not-configured"),
  ai: process.env.USE_MOCK_AI === "true"
    ? "mock"
    : (process.env.OPENAI_API_KEY ? "ready" : "no-key")
}));

// ─── Routes ───
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/whatsapp", whatsappRouter);

// Business router inline stub (to be expanded in future phases)
const businessRouter = express.Router();
businessRouter.get("/", (_req, res) => res.json({ message: "Business router" }));
app.use("/api/v1/business", businessRouter);

// ─── Global error handler ───
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[ERROR]", err.message || err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`📱 WhatsApp Webhook: http://localhost:${PORT}/api/v1/whatsapp/webhook`);
  console.log(`🤖 AI Mode: ${process.env.USE_MOCK_AI === "true" ? "MOCK (Sandbox)" : (process.env.OPENAI_API_KEY ? "GPT-4o LIVE" : "No API Key")}`);
  console.log(`💬 Sandbox: ${process.env.USE_MOCK_WHATSAPP === "true" ? "ON" : "OFF (Real WhatsApp)"}`);
});

// Initialize Prisma client (for graceful shutdown handling)
initPrisma();

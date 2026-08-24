// src/modules/whatsapp/whatsapp.router.ts
import { Router, Request, Response } from "express";
import { parseWebhookPayload, processIncomingMessage } from "./whatsapp.service";
import { getPrisma } from "../../utils/prisma";
import { logger } from "../../utils/logger";

const prisma = getPrisma();

const router = Router();

// ─────────────────────────────────────────────
// GET /webhook — Meta webhook verification
// ─────────────────────────────────────────────
router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WA_WEBHOOK_VERIFY_TOKEN || "flowreply_webhook_2026";

  if (mode === "subscribe" && token === verifyToken) {
    logger.info("[WA] Webhook verified by Meta ✓");
    res.status(200).send(challenge);
  } else {
    logger.warn("[WA] Webhook verification failed");
    res.sendStatus(403);
  }
});

// ─────────────────────────────────────────────
// POST /webhook — Incoming WhatsApp messages
// ─────────────────────────────────────────────
router.post("/webhook", async (req: Request, res: Response) => {
  // Always respond 200 immediately to Meta (within 20 seconds)
  res.sendStatus(200);

  const body = req.body;

  // Verify it's a WhatsApp message (not other webhook events)
  if (body?.object !== "whatsapp_business_account") return;

  const incoming = parseWebhookPayload(body);
  if (!incoming) {
    logger.info("[WA] Received non-message webhook event (status update, etc.)");
    return;
  }

  // Process message asynchronously
  processIncomingMessage(incoming).catch(err => {
    logger.error("[WA] Error processing incoming message", err);
  });
});

// ─────────────────────────────────────────────
// GET /conversations — Fetch all conversations (for Dashboard)
// ─────────────────────────────────────────────
router.get("/conversations", async (_req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1 // Last message preview
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 50
    });

    res.json({ conversations });
  } catch (err) {
    logger.error("[WA] Failed to fetch conversations", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// ─────────────────────────────────────────────
// GET /conversations/:id — Fetch specific conversation messages
// ─────────────────────────────────────────────
router.get("/conversations/:id", async (req: Request, res: Response) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({ conversation });
  } catch (err) {
    logger.error("[WA] Failed to fetch conversation", err);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// ─────────────────────────────────────────────
// POST /simulate — Sandbox: Simulate incoming WhatsApp message
// Used by the frontend dashboard for testing
// ─────────────────────────────────────────────
router.post("/simulate", async (req: Request, res: Response) => {
  const { message, phone = "+923001234567", type = "text" } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  const incoming = {
    type: type as "text" | "audio",
    from: phone,
    waMessageId: `sim_${Date.now()}`,
    text: message,
    profileName: "Sandbox User"
  };

  try {
    await processIncomingMessage(incoming);
    res.json({ success: true, message: "Message processed" });
  } catch (err) {
    logger.error("[WA] Simulate error", err);
    res.status(500).json({ error: "Failed to process simulated message" });
  }
});

export default router;

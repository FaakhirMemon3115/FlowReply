// src/modules/whatsapp/whatsapp.service.ts
// Core WhatsApp webhook processing logic
import { PrismaClient } from "../../generated/client";
import { generateAIReply, transcribeAudio, textToSpeech, detectLanguage } from "../../services/ai.service";
import {
  sendTextMessage,
  sendAudioMessage,
  downloadMediaFile
} from "../../services/whatsapp-api.service";
import { logger } from "../../utils/logger";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// Parse Meta Webhook Payload
// ─────────────────────────────────────────────
export interface WAIncomingMessage {
  type: "text" | "audio" | "image" | "document" | "unknown";
  from: string;
  waMessageId: string;
  text?: string;
  mediaId?: string;
  profileName?: string;
}

export const parseWebhookPayload = (body: any): WAIncomingMessage | null => {
  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) return null;

    const from: string = message.from;
    const waMessageId: string = message.id;
    const profileName: string = value?.contacts?.[0]?.profile?.name || "";
    const type = message.type as WAIncomingMessage["type"];

    if (type === "text") {
      return { type: "text", from, waMessageId, text: message.text?.body, profileName };
    }

    if (type === "audio") {
      return { type: "audio", from, waMessageId, mediaId: message.audio?.id, profileName };
    }

    return { type: "unknown", from, waMessageId, profileName };
  } catch (err) {
    logger.error("[WA] Failed to parse webhook payload", err);
    return null;
  }
};

// ─────────────────────────────────────────────
// Get or Create Conversation
// ─────────────────────────────────────────────
const getOrCreateConversation = async (customerPhone: string, customerName?: string) => {
  let conversation = await prisma.conversation.findFirst({
    where: { customerPhone, status: "open" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } }
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        customerPhone,
        customerName: customerName || customerPhone,
        status: "open"
      },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } }
    });
    logger.info(`[WA] New conversation started: ${customerPhone}`);
  }

  return conversation;
};

// ─────────────────────────────────────────────
// Save Message to DB
// ─────────────────────────────────────────────
const saveMessage = async (params: {
  conversationId: string;
  waMessageId?: string;
  direction: "inbound" | "outbound";
  type: string;
  content?: string;
  mediaUrl?: string;
  transcription?: string;
  senderType: "customer" | "bot" | "agent";
  language?: string;
}) => {
  return prisma.message.create({ data: params });
};

// ─────────────────────────────────────────────
// Main WhatsApp Message Processor
// ─────────────────────────────────────────────
export const processIncomingMessage = async (incoming: WAIncomingMessage): Promise<void> => {
  const useMockWA = process.env.USE_MOCK_WHATSAPP === "true";

  logger.info(`[WA] Processing message from ${incoming.from} (type: ${incoming.type})`);

  // Get or create conversation
  const conversation = await getOrCreateConversation(incoming.from, incoming.profileName);

  // Build conversation history for context
  const conversationHistory = conversation.messages
    .filter(m => m.content)
    .map(m => ({
      role: (m.senderType === "customer" ? "user" : "assistant") as "user" | "assistant",
      content: m.content || ""
    }))
    .slice(-10); // Last 10 messages for context

  let userText = "";
  let detectedLanguage: "en" | "roman_urdu" | "ur" = "en";
  let isVoiceMessage = false;
  let voiceFilePath: string | null = null;

  // ── STEP 1: Handle incoming message type ──
  if (incoming.type === "text" && incoming.text) {
    userText = incoming.text;
    detectedLanguage = detectLanguage(userText);

    // Save inbound text message
    await saveMessage({
      conversationId: conversation.id,
      waMessageId: incoming.waMessageId,
      direction: "inbound",
      type: "text",
      content: userText,
      senderType: "customer",
      language: detectedLanguage
    });

  } else if (incoming.type === "audio" && incoming.mediaId) {
    isVoiceMessage = true;

    // Save inbound audio message (before processing)
    await saveMessage({
      conversationId: conversation.id,
      waMessageId: incoming.waMessageId,
      direction: "inbound",
      type: "audio",
      senderType: "customer"
    });

    if (!useMockWA) {
      // Download voice file from WhatsApp
      voiceFilePath = await downloadMediaFile(incoming.mediaId);
    }

    if (voiceFilePath) {
      // Transcribe with Whisper
      userText = await transcribeAudio(voiceFilePath);
      detectedLanguage = detectLanguage(userText);
      logger.info(`[WA] Voice transcription: "${userText}" (${detectedLanguage})`);

      // Update message with transcription
      await prisma.message.update({
        where: { waMessageId: incoming.waMessageId },
        data: { transcription: userText, language: detectedLanguage }
      });
    } else {
      // Mock mode: use default text
      userText = "Voice message received";
    }
  } else {
    logger.info(`[WA] Unsupported message type: ${incoming.type}`);
    return;
  }

  // Update conversation language detection
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { language: detectedLanguage, updatedAt: new Date() }
  });

  // ── STEP 2: Generate AI Reply ──
  const { reply, language } = await generateAIReply(userText, conversationHistory);
  logger.info(`[WA] AI reply (${language}): "${reply.substring(0, 80)}..."`);

  // ── STEP 3: Send Reply ──
  if (isVoiceMessage) {
    // Voice in → Voice out (TTS) + text fallback
    try {
      const audioPath = await textToSpeech(reply, language);

      if (!useMockWA) {
        await sendAudioMessage(incoming.from, audioPath);
      }

      // Also send text version as fallback
      if (!useMockWA) {
        await sendTextMessage(incoming.from, `_[AI Voice Reply]_\n\n${reply}`);
      }

      // Save outbound audio reply
      await saveMessage({
        conversationId: conversation.id,
        direction: "outbound",
        type: "audio",
        content: reply,
        senderType: "bot",
        language
      });

    } catch (ttsErr) {
      // TTS failed: fall back to text
      logger.warn("[WA] TTS failed, falling back to text reply", ttsErr);
      if (!useMockWA) await sendTextMessage(incoming.from, reply);

      await saveMessage({
        conversationId: conversation.id,
        direction: "outbound",
        type: "text",
        content: reply,
        senderType: "bot",
        language
      });
    }
  } else {
    // Text in → Text out
    if (!useMockWA) {
      await sendTextMessage(incoming.from, reply);
    }

    await saveMessage({
      conversationId: conversation.id,
      direction: "outbound",
      type: "text",
      content: reply,
      senderType: "bot",
      language
    });
  }
};

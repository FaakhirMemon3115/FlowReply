// src/services/ai.service.ts
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined
});

// ─────────────────────────────────────────────
// Language Detection
// Detect if text is: "en" | "roman_urdu" | "ur"
// ─────────────────────────────────────────────
export const detectLanguage = (text: string): "en" | "roman_urdu" | "ur" => {
  // Urdu script Unicode range: 0600–06FF
  const urduScriptRegex = /[\u0600-\u06FF]/;
  if (urduScriptRegex.test(text)) return "ur";

  // Roman Urdu keywords (common words used in Roman Urdu)
  const romanUrduKeywords = [
    "kya", "hai", "ho", "na", "kar", "mera", "meri", "teri", "tera",
    "aap", "tum", "main", "hum", "ap", "karo", "bhi", "nahi", "nhi",
    "kuch", "sab", "abhi", "kal", "aj", "aaj", "order", "chahiye",
    "batao", "batain", "bata", "help", "chahye", "kahan", "kidhar",
    "hy", "hain", "hen", "kiun", "kion", "price", "kitna", "kitne"
  ];

  const lower = text.toLowerCase();
  const matchCount = romanUrduKeywords.filter(word => lower.includes(word)).length;
  if (matchCount >= 1) return "roman_urdu";

  return "en";
};

// ─────────────────────────────────────────────
// System Prompt by Language
// ─────────────────────────────────────────────
const getSystemPrompt = (lang: "en" | "roman_urdu" | "ur"): string => {
  const base = `You are FlowReply AI — a smart WhatsApp customer support and ecommerce assistant. 
You help customers with: order status, product recommendations, shipping tracking, returns, and general support.
Always be helpful, professional, and concise.
Never reveal that you are an AI model or GPT. Say you are "FlowReply AI Assistant".`;

  if (lang === "ur") {
    return `${base}
CRITICAL: You MUST reply ONLY in Urdu script (اردو). Never use English or Roman Urdu in your reply. Always use proper Urdu script characters.`;
  }

  if (lang === "roman_urdu") {
    return `${base}
CRITICAL: You MUST reply ONLY in Roman Urdu (Urdu words written in English/Latin letters). Never use Urdu script. Never use English. Reply as if texting a Pakistani friend.
Example style: "Shukriya aap ki message ka. Aap ka order number batain taake main check kar sakoun."`;
  }

  return `${base}
Reply in clear, friendly English.`;
};

// ─────────────────────────────────────────────
// Generate GPT-4o Text Reply
// ─────────────────────────────────────────────
export const generateAIReply = async (
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<{ reply: string; language: "en" | "roman_urdu" | "ur" }> => {
  const language = detectLanguage(userMessage);
  const systemPrompt = getSystemPrompt(language);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage }
  ];

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages,
    max_tokens: 500,
    temperature: 0.7
  });

  const reply = completion.choices[0]?.message?.content || "I'm unable to process your request right now.";
  return { reply, language };
};

// ─────────────────────────────────────────────
// Transcribe Voice Message (Whisper STT)
// ─────────────────────────────────────────────
export const transcribeAudio = async (audioFilePath: string): Promise<string> => {
  const fileStream = fs.createReadStream(audioFilePath);

  const transcription = await openai.audio.transcriptions.create({
    file: fileStream,
    model: "whisper-1",
    response_format: "text"
  });

  return transcription as unknown as string;
};

// ─────────────────────────────────────────────
// Text-to-Speech (OpenAI TTS)
// Returns path to generated audio file
// ─────────────────────────────────────────────
export const textToSpeech = async (text: string, language: "en" | "roman_urdu" | "ur"): Promise<string> => {
  // Use different voice/instructions based on language
  const voice: "nova" | "alloy" | "shimmer" = language === "en" ? "nova" : "shimmer";

  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input: text,
    response_format: "mp3"
  });

  const outputPath = path.join(process.cwd(), "tmp", `tts_${Date.now()}.mp3`);

  // Ensure tmp directory exists
  if (!fs.existsSync(path.join(process.cwd(), "tmp"))) {
    fs.mkdirSync(path.join(process.cwd(), "tmp"), { recursive: true });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
};

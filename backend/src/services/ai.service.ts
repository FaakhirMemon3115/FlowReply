// src/services/ai.service.ts
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const useMockAI = () => process.env.USE_MOCK_AI === "true";

let openai: OpenAI | null = null;

const getOpenAI = (): OpenAI => {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is required when USE_MOCK_AI=false. Set USE_MOCK_AI=true for local sandbox mode."
      );
    }
    openai = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined
    });
  }
  return openai;
};

// ─────────────────────────────────────────────
// Language Detection
// Detect if text is: "en" | "roman_urdu" | "ur"
// ─────────────────────────────────────────────
export const detectLanguage = (text: string): "en" | "roman_urdu" | "ur" => {
  const urduScriptRegex = /[\u0600-\u06FF]/;
  if (urduScriptRegex.test(text)) return "ur";

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

const mockAIReply = (
  userMessage: string,
  language: "en" | "roman_urdu" | "ur"
): string => {
  const lower = userMessage.toLowerCase();

  if (language === "ur") {
    if (lower.includes("order") || lower.includes("آرڈر")) {
      return "شکریہ! میں نے آپ کا آرڈر چیک کیا۔ آپ کا آرڈر #FR-12345 ڈسپیچ ہو چکا ہے اور 2-3 دن میں پہنچ جائے گا۔ مزید مدد چاہیے تو بتائیں۔";
    }
    return "السلام علیکم! میں FlowReply AI Assistant ہوں۔ آپ کیسے مدد کر سکتا ہوں؟ آرڈر، شپنگ، یا پروڈucts کے بارے میں پوچھیں۔";
  }

  if (language === "roman_urdu") {
    if (lower.includes("order")) {
      return "Shukriya! Aap ka order #FR-12345 dispatch ho chuka hai aur 2-3 din mein deliver ho jayega. Aur kuch help chahiye to batain.";
    }
    return "Assalam o Alaikum! Main FlowReply AI Assistant hoon. Aap ki kya madad kar sakta hoon? Order, shipping ya products ke bare mein pooch sakte hain.";
  }

  if (lower.includes("order") || lower.includes("status") || lower.includes("track")) {
    return "Thanks for reaching out! Your order #FR-12345 has been dispatched and should arrive in 2-3 business days. Need anything else?";
  }

  return "Hello! I'm FlowReply AI Assistant. How can I help you today? I can assist with orders, shipping, products, and returns.";
};

// ─────────────────────────────────────────────
// Generate GPT-4o Text Reply
// ─────────────────────────────────────────────
export const generateAIReply = async (
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<{ reply: string; language: "en" | "roman_urdu" | "ur" }> => {
  const language = detectLanguage(userMessage);

  if (useMockAI()) {
    return { reply: mockAIReply(userMessage, language), language };
  }

  const systemPrompt = getSystemPrompt(language);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage }
  ];

  const completion = await getOpenAI().chat.completions.create({
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
  if (useMockAI()) {
    return "mera order kahan hai bhai?";
  }

  const fileStream = fs.createReadStream(audioFilePath);
  const transcription = await getOpenAI().audio.transcriptions.create({
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
  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const outputPath = path.join(tmpDir, `tts_${Date.now()}.mp3`);

  if (useMockAI()) {
    fs.writeFileSync(outputPath, Buffer.from("mock-audio"));
    return outputPath;
  }

  const voice: "nova" | "alloy" | "shimmer" = language === "en" ? "nova" : "shimmer";
  const response = await getOpenAI().audio.speech.create({
    model: "tts-1",
    voice,
    input: text,
    response_format: "mp3"
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
};

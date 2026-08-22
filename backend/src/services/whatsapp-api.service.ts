// src/services/whatsapp-api.service.ts
// Official Meta WhatsApp Business Cloud API integration
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import FormData from "form-data";

const WA_API_BASE = `https://graph.facebook.com/${process.env.WA_API_VERSION || "v20.0"}`;
const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;

const waClient = axios.create({
  baseURL: WA_API_BASE,
  headers: {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json"
  }
});

// ─────────────────────────────────────────────
// Send Text Message to a WhatsApp number
// ─────────────────────────────────────────────
export const sendTextMessage = async (to: string, text: string): Promise<string | null> => {
  try {
    const response = await waClient.post(`/${PHONE_NUMBER_ID}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text, preview_url: false }
    });
    return response.data?.messages?.[0]?.id || null;
  } catch (err: any) {
    console.error("[WA] sendTextMessage error:", err?.response?.data || err.message);
    return null;
  }
};

// ─────────────────────────────────────────────
// Send Audio Message to a WhatsApp number
// ─────────────────────────────────────────────
export const sendAudioMessage = async (to: string, audioFilePath: string): Promise<string | null> => {
  try {
    // Step 1: Upload media to WhatsApp
    const mediaId = await uploadMedia(audioFilePath);
    if (!mediaId) return null;

    // Step 2: Send audio message using media ID
    const response = await waClient.post(`/${PHONE_NUMBER_ID}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "audio",
      audio: { id: mediaId }
    });

    return response.data?.messages?.[0]?.id || null;
  } catch (err: any) {
    console.error("[WA] sendAudioMessage error:", err?.response?.data || err.message);
    return null;
  }
};

// ─────────────────────────────────────────────
// Upload Media to WhatsApp Servers
// Returns WhatsApp media ID
// ─────────────────────────────────────────────
export const uploadMedia = async (filePath: string): Promise<string | null> => {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType: "audio/mpeg"
    });
    form.append("messaging_product", "whatsapp");

    const response = await axios.post(
      `${WA_API_BASE}/${PHONE_NUMBER_ID}/media`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    return response.data?.id || null;
  } catch (err: any) {
    console.error("[WA] uploadMedia error:", err?.response?.data || err.message);
    return null;
  }
};

// ─────────────────────────────────────────────
// Download WhatsApp Voice Message File
// Returns local file path
// ─────────────────────────────────────────────
export const downloadMediaFile = async (mediaId: string): Promise<string | null> => {
  try {
    // Get media URL
    const metaResponse = await waClient.get(`/${mediaId}`, {
      params: { phone_number_id: PHONE_NUMBER_ID }
    });
    const mediaUrl = metaResponse.data?.url;
    if (!mediaUrl) return null;

    // Download the file
    const fileResponse = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    });

    // Ensure tmp dir exists
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const localPath = path.join(tmpDir, `voice_${mediaId}.ogg`);
    fs.writeFileSync(localPath, Buffer.from(fileResponse.data));

    return localPath;
  } catch (err: any) {
    console.error("[WA] downloadMediaFile error:", err?.response?.data || err.message);
    return null;
  }
};

// ─────────────────────────────────────────────
// Send Interactive Message (for product lists, etc.)
// ─────────────────────────────────────────────
export const sendInteractiveListMessage = async (
  to: string,
  headerText: string,
  bodyText: string,
  items: Array<{ id: string; title: string; description?: string }>
): Promise<string | null> => {
  try {
    const response = await waClient.post(`/${PHONE_NUMBER_ID}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: headerText },
        body: { text: bodyText },
        action: {
          button: "View Options",
          sections: [{ title: "Options", rows: items }]
        }
      }
    });
    return response.data?.messages?.[0]?.id || null;
  } catch (err: any) {
    console.error("[WA] sendInteractiveListMessage error:", err?.response?.data || err.message);
    return null;
  }
};

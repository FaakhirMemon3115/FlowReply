# FlowReply — WhatsApp AI CRM

Multi-language WhatsApp customer support platform with AI auto-replies (English, Roman Urdu, Urdu).

## Quick Start (No External APIs Needed)

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Setup database (SQLite — no PostgreSQL required)
cd ../backend
npx prisma generate
npx prisma db push

# 3. Start backend (Terminal 1)
npm run dev

# 4. Start frontend (Terminal 2)
cd ../frontend
npm run dev
```

Open **http://localhost:5173** — Dashboard will show "Backend Connected" and "AI: Mock (Sandbox)".

Use the **Sandbox Simulator** to send test messages. AI will auto-reply in the same language.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/v1/whatsapp/conversations` | List all conversations |
| GET | `/api/v1/whatsapp/conversations/:id` | Get conversation with messages |
| POST | `/api/v1/whatsapp/simulate` | Simulate incoming WhatsApp message |
| GET | `/api/v1/whatsapp/webhook` | Meta webhook verification |
| POST | `/api/v1/whatsapp/webhook` | Receive real WhatsApp messages |
| POST | `/api/v1/auth/register` | Register user + business |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |

---

## Enable Real APIs

Edit `backend/.env`:

### OpenAI (GPT-4o + Whisper + TTS)
```env
USE_MOCK_AI=false
OPENAI_API_KEY=sk-your-key-here
```

### WhatsApp Business Cloud API
```env
USE_MOCK_WHATSAPP=false
WA_PHONE_NUMBER_ID=your_phone_number_id
WA_ACCESS_TOKEN=your_permanent_token
WA_WEBHOOK_VERIFY_TOKEN=flowreply_webhook_2026
```

Then expose your server via ngrok:
```bash
ngrok http 4000
```

Set webhook URL in Meta Developer Console:
`https://YOUR-NGROK-URL/api/v1/whatsapp/webhook`

---

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma (SQLite)
- **Frontend:** React 19, Vite, Tailwind CSS 4
- **AI:** OpenAI GPT-4o, Whisper, TTS
- **WhatsApp:** Meta Cloud API v20.0

---

## Project Structure

```
FlowReply/
├── backend/          # Express API server
│   ├── prisma/       # Database schema + SQLite dev.db
│   └── src/
│       ├── modules/  # auth, whatsapp routes
│       └── services/ # AI, WhatsApp API
├── frontend/         # React dashboard
└── packages/shared/  # Shared types
```

# AI Customer Support Voice Agent 🤖

> A production-ready, voice-powered AI customer support system for e-commerce, built with **Next.js 14**, **Express**, and **Google Gemini 2.5 Flash** (via **Google Generative AI SDK**), deployed on **Google Cloud**.

![Project Banner](https://img.shields.io/badge/AI-Gemini_1.5_Flash-blue?style=for-the-badge&logo=google)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-Deployed-4285F4?style=for-the-badge&logo=google-cloud)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Express](https://img.shields.io/badge/Express-5.x-green?style=for-the-badge&logo=express)

---

## 🌟 Features

- **🎙️ Voice Input** — Web Speech API for hands-free interaction (Chrome)
- **🔊 Voice Output** — SpeechSynthesis API reads AI responses aloud
- **⚡ Interruption Handling** — Click mic while AI speaks to stop it instantly
- **🧠 Intent Detection** — Classifies messages: order_status, return_request, faq, complaint
- **😠 Sentiment Analysis** — Detects angry/frustrated users and responds empathetically
- **📦 Order Tracking** — Real-time lookup of 12 mock orders by ID or product name
- **↩️ Return Processing** — Initiates return requests and tracks them
- **❓ FAQ Answers** — 10 policy topics with keyword matching
- **🎟️ Human Escalation** — Generates TICKET-XXXX IDs for unresolved queries
- **📊 Live Dashboard** — Real-time conversation monitoring for support agents
- **👤 Agent Takeover** — Human agents can send replies directly from the dashboard

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     USER (Browser)                             │
│   Web Speech API (STT) ◄──── VoiceAgent ────► SpeechSynthesis │
│                                  │                             │
└────────────────────────┬─────────┘────────────────────────────┘
                         │ HTTP (fetch)
┌────────────────────────▼───────────────────────────────────────┐
│                   EXPRESS BACKEND (port 5000)                   │
│                                                                 │
│  POST /api/agent/query                                          │
│    ├─► intentService   → Classifies message intent             │
│    ├─► sentimentService → Detects emotional tone               │
│    ├─► orderService    → Looks up order / creates return       │
│    ├─► memoryService   → Stores session + history              │
│    ├─► geminiService   → Generates AI response (Gemini 1.5 Flash via Google GenAI SDK)    │
│                                                                 │
│  GET /api/agent/conversations — Returns all sessions           │
│  POST /api/agent/human-reply — Human agent sends message       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ai-customer-support-agent/
├── backend/
│   ├── server.js                 # Express server (port 5000)
│   ├── .env                      # Environment variables
│   ├── package.json
│   ├── routes/
│   │   └── agentRoutes.js        # API route definitions
│   ├── controllers/
│   │   └── agentController.js    # Request orchestration
│   ├── services/
│   │   ├── geminiService.js      # Google GenAI SDK integration (Gemini 1.5 Flash)
│   │   ├── intentService.js      # Hybrid intent detection
│   │   ├── sentimentService.js   # Keyword sentiment analysis
│   │   ├── orderService.js       # Order lookup & returns
│   │   └── memoryService.js      # Conversation sessions
│   ├── database/
│   │   ├── orders.json           # 12 mock orders
│   │   └── faq.json              # 10 FAQ entries
│   └── utils/
│       └── ticketGenerator.js    # TICKET-XXXX generator
│
└── frontend/
    ├── pages/
    │   ├── index.js              # Main voice agent UI
    │   └── dashboard.js          # Support dashboard
    ├── components/
    │   ├── VoiceAgent.js         # Core voice + chat orchestrator
    │   ├── ConversationWindow.js # Animated chat bubbles
    │   ├── MicrophoneButton.js   # Animated mic with pulse rings
    │   └── StatusIndicator.js    # Listening/Thinking/Speaking states
    ├── services/
    │   └── api.js                # Fetch wrapper for backend
    ├── styles/
    │   └── globals.css           # Custom animations & design system
    └── .env.local                # Frontend env vars
```

---

## 🚀 Quick Start


### Prerequisites

- Node.js ≥ 18
- Google Gemini API Key ([get one free](https://aistudio.google.com/app/apikey))
- Chrome browser (for Web Speech API)


### 1. Clone / Open the project

```bash
cd ai-customer-support-agent
```

### 2. Configure the backend

```bash
cd backend
```

Edit `.env` and add your Gemini API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=5000
```

### 3. Start the backend

```bash
npm install     # Already done if you ran this before
npm start       # or: npm run dev  (with hot reload)
```

Verify: open http://localhost:5000/api/test — you should see `{"status":"ok"}`.

### 4. Start the frontend

```bash
cd ../frontend
npm install     # Already done
npm run dev
```

Open **http://localhost:3000** in Chrome.

---

## 🎮 Demo Instructions

### Voice Agent (http://localhost:3000)

1. **Click the microphone button** and speak clearly
2. Try these example phrases:
   - *"Where is my order ORD1001?"* → Order tracking
   - *"I want to return my headphones"* → Return processing
   - *"What is your refund policy?"* → FAQ answer
   - *"I am really angry, my package never arrived!"* → Empathetic complaint handling
   - *"I need to cancel my subscription to something"* → Human escalation (TICKET)
3. The AI response is **spoken aloud automatically**
4. **Click mic while AI is speaking** to interrupt it
5. You can also **type messages** in the text input

### Support Dashboard (http://localhost:3000/dashboard)

1. After having conversations, open the dashboard
2. See all conversations with **intent badges** and **sentiment emojis**
3. Click any conversation to **expand the thread**
4. Use the **Reply** form to send a message as a human support agent

---

## 📡 API Documentation

### `GET /api/test`
Health check.

**Response:**
```json
{ "status": "ok", "model": "gemini-2.5-flash" }
```

---

### `POST /api/agent/query`
Send a message to the AI agent.

**Request:**
```json
{
  "message": "Where is my order ORD1001?",
  "conversationId": null
}
```

**Response:**
```json
{
  "conversationId": "uuid-string",
  "response": "Great news! Your Nike Air Max Running Shoes have shipped and are expected by March 20. Is there anything else?",
  "intent": "order_status",
  "sentiment": "neutral",
  "confidence": 0.9,
  "isEscalated": false,
  "orderInfo": { "order_id": "ORD1001", "status": "Shipped", ... }
}
```

---

### `GET /api/agent/conversations`
Get all conversations for the dashboard.

**Response:**
```json
{
  "conversations": [...],
  "stats": {
    "total": 5,
    "active": 4,
    "escalated": 1,
    "byIntent": { "order_status": 2, "faq": 3 },
    "bySentiment": { "neutral": 4, "angry": 1 }
  }
}
```

---

### `POST /api/agent/human-reply`
Human agent sends a reply to a conversation.

**Request:**
```json
{
  "conversationId": "uuid-string",
  "message": "Hi, I'm Sarah from support. I'll resolve this immediately.",
  "agentName": "Sarah"
}
```

**Response:**
```json
{ "success": true, "conversationId": "...", "agentName": "Sarah" }
```

---

## 🌐 Deployment (Google Cloud)

### Backend → Google Cloud Run

1.  **Containerize**: The project includes a `Dockerfile` for the backend.
2.  **Push to Artifact Registry**:
    ```bash
    gcloud builds submit --tag gcr.io/[PROJECT_ID]/alex-backend
    ```
3.  **Deploy to Cloud Run**:
    ```bash
    gcloud run deploy alex-backend --image gcr.io/[PROJECT_ID]/alex-backend --platform managed --set-env-vars "GEMINI_API_KEY=your_key"
    ```

### Frontend → Google Cloud Run (or Vercel)

1.  **Build**: `npm run build`
2.  **Deploy**: Similar to backend, using the `Dockerfile` in the frontend directory.
3.  Set environment variable:
    ```
    NEXT_PUBLIC_API_URL=https://alex-backend-xxxxx.a.run.app
    ```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 14 (Pages Router) |
| UI Styling | TailwindCSS + Custom CSS Animations |
| Voice Input | Web Speech API (SpeechRecognition) |
| Voice Output | Web Speech API (SpeechSynthesis) |
| Backend | Node.js + Express 4 |
| AI Model | **Google Gemini 1.5 Flash** |
| AI SDK | **Google Generative AI SDK** (`@google/generative-ai`) |
| Infrastructure | **Google Cloud Platform (GCP)** |
| Deployment | **Google Cloud Run** |
| Database | JSON flat files (mock) |
| Session Memory | In-memory Map (Node.js) |

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google AI Studio API key | ✅ Yes |
| `PORT` | Server port (default: 5000) | No |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: http://localhost:5000) |

---

## 📝 License

MIT — feel free to use this project for learning and demos.

---

*Built with ❤️ using Google Gemini 1.5 Flash AI & Google Cloud*

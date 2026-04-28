# 🐕 CERBERUS-AI

**Autonomous Black-Box AI System Integrity Auditor**

> Test any AI-powered application from a single URL — discover hidden vulnerabilities, unsafe logic, and bias before they cause real-world harm.

---

## What It Does

CERBERUS-AI is a black-box auditing platform that takes a URL and autonomously:

1. **Crawls** the application using Playwright to discover all API endpoints
2. **Classifies** endpoints by risk using Google Gemini AI
3. **Tests** for security vulnerabilities (IDOR, auth bypass, input validation)
4. **Detects** bias in AI decision-making endpoints
5. **Generates** a full report with proof, AI explanations, and fixes

No source code. No documentation. No internal access needed.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│         (Vite + Tailwind + Recharts + Zustand)          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP + SSE
┌──────────────────────▼──────────────────────────────────┐
│                  Node.js Backend                         │
│              (Express + Firebase)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Scan       │  │ Vulnerability│  │  Bias         │  │
│  │ Orchestrator│  │   Engine     │  │  Engine       │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Gemini AI Service                   │    │
│  │  (classify • explain • generate personas)        │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────────┐
│              Playwright Crawler Service                  │
│     (headless Chrome • API interception • form fill)    │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Google Gemini API key ([get one free](https://aistudio.google.com/app/apikey))

### 1. Install Dependencies

```bash
npm install
npm install --workspace=frontend
npm install --workspace=backend
npm install --workspace=crawler
npm install --workspace=demo-target
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_key_here
```

### 3. Start Services

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 — Crawler (optional but recommended):**
```bash
cd crawler
npm run install:browsers   # First time only
npm run dev
```

**Terminal 3 — Frontend:**
```bash
cd frontend && npm run dev
```

**Terminal 4 — Demo Target (for testing):**
```bash
cd demo-target && npm start
```

### 4. Open the App

Navigate to **http://localhost:5173**

To test with the demo target, enter: `http://localhost:3001`

---

## Demo Scenario

The included demo target (`demo-target/`) is an intentionally vulnerable loan approval API with:

| Vulnerability | Type | Severity |
|---|---|---|
| User data accessible by ID without auth | IDOR | High |
| Profile endpoint requires no authentication | Auth Bypass | Critical |
| Loan approval uses gender/region as factors | Bias | High |

Run the demo target and scan `http://localhost:3001` to see CERBERUS-AI in action.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript |
| Crawler | Playwright (headless Chromium) |
| AI | Google Gemini 1.5 Flash |
| Cloud | Firebase Firestore (optional) |
| Real-time | Server-Sent Events (SSE) |

---

## API Reference

### Start a Scan
```http
POST /api/scans
Content-Type: application/json

{
  "targetUrl": "https://target.com",
  "options": {
    "enableBiasDetection": true,
    "enableVulnTesting": true,
    "maxDepth": 3,
    "authHeaders": {
      "Authorization": "Bearer token"
    }
  }
}
```

### Get Scan Status
```http
GET /api/scans/:id
```

### Stream Real-time Events
```http
GET /api/scans/:id/events   (SSE)
```

### Get Full Report
```http
GET /api/reports/:scanId
```

### Download Report
```http
GET /api/reports/:scanId/download
```

---

## Firebase Setup (Optional)

For persistent storage across restarts:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore
3. Generate a service account key
4. Add to `backend/.env`:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   ```

Without Firebase, scans are stored in memory and lost on restart.

---

## Project Structure

```
cerberus-ai/
├── frontend/          # React app (Vite + Tailwind)
├── backend/           # Node.js API + scan orchestration
├── crawler/           # Playwright crawler microservice
├── shared/            # Shared TypeScript types
├── demo-target/       # Intentionally vulnerable test API
└── README.md
```

---

## Alignment

- **Theme:** Unbiased AI Decision (PS-4)
- **Track:** Open Innovation
- **Focus:** AI system integrity and trust

---

*CERBERUS-AI — ensuring AI-powered applications are secure, fair, and trustworthy before they impact real users.*

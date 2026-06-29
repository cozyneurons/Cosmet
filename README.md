# Cosmet - Cosmetic Ingredient Analyzer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Gemini 3.1 Flash Lite](https://img.shields.io/badge/Gemini-3.1%20Flash%20Lite-orange.svg)](https://ai.google.dev/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-green.svg)](https://github.com/langchain-ai/langgraph)
[![FastEmbed](https://img.shields.io/badge/FastEmbed-ONNX%20Runtime-blue.svg)](https://github.com/qdrant/fastembed)

> **A multi-agent AI system that analyzes cosmetic ingredients in seconds, delivering personalized safety assessments based on user allergies and skin type. Built on a production-ready Next.js + FastAPI stack with Google OAuth authentication.**

From 20 minutes of manual research to seconds of validated, personalized AI analysis.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Testing & Validation](#testing--validation)
- [Deployment](#deployment)
- [Acknowledgments](#acknowledgments)

---

## 🎯 Overview

**Cosmet** is a multi-agent AI system that analyzes cosmetic ingredients in seconds, delivering personalized safety assessments based on your skin type and allergen profile. It demonstrates true agentic behavior through autonomous decision-making, self-correction, and dynamic workflow orchestration.

A key safety feature is the **Product Relevance Gate** — the Critic Agent automatically detects if a submitted ingredient list belongs to a non-cosmetic product (e.g., a food item, beverage, or cleaning chemical) and terminates the analysis with a clear rejection message instead of generating a misleading safety report.

---

## 🏗️ Architecture

```
                                  ┌───────────────────────────┐
                                  │      Next.js Frontend     │
                                  │  (React + TypeScript)     │
                                  │  Google OAuth Sign-In     │
                                  └─────────────┬─────────────┘
                                                │
                                    HTTP API &  │  WebSockets (Real-time Logs)
                                    JWT Auth    │
                                                ▼
                                  ┌───────────────────────────┐
                                  │      FastAPI Backend      │
                                  │       (Python 3.12)       │
                                  └───────┬───────────────┬───┘
                                          │               │
                            Vector DB     │               │  Sessions,
                            Queries       │               │  Analysis History
                                          ▼               ▼
                                   ┌────────────┐   ┌────────────┐
                                   │Qdrant Cloud│   │Redis Cloud │
                                   │ (Vector)   │   │  (Cache)   │
                                   └────────────┘   └────────────┘
```

### Agent Specifications (LangGraph Orchestration)

1. **Supervisor Agent:** Orchestrates the entire workflow. Routes to the correct agent based on state, enforces a max of 5 retries per agent, and immediately terminates if a non-cosmetic product is detected (`invalid_product` flag).
2. **Research Agent:** Performs semantic vector search in Qdrant with confidence boosting (exact name match → 1.0, substring match → 0.85). Falls back to **Tavily web search** when Qdrant confidence is below 0.7.
3. **Analysis Agent:** Generates a personalized markdown safety report adapted to the user's skin type, allergy profile, and expertise level (beginner/intermediate/expert).
4. **Critic Agent:** Runs 6 validation gates — completeness, format, allergen matching, score consistency, tone appropriateness, and **Product Relevance** (Gate 6 rejects non-cosmetic products). Rejects incomplete reports and sends them back to the Analysis Agent with specific feedback.

---

## ✨ Key Features

- **Google OAuth Only**: Secure, passwordless login via Google Sign-In. No email/password registration.
- **Smart Vector Search**: FastEmbed (ONNX Runtime) generates 384-dimensional embeddings without PyTorch — 10x lighter than `sentence-transformers`.
- **Dual Knowledge Sources**: Qdrant vector DB (68 seeded ingredients) + Tavily web search fallback for any ingredient not in the database.
- **Product Relevance Gate**: The Critic Agent automatically rejects non-cosmetic ingredient lists (energy drinks, food items, etc.) before generating a misleading safety report.
- **Real-Time Agent Progress**: WebSocket stream transmitting live agent stage updates directly to a progress display in the frontend.
- **Personalized Safety Scoring**: Adjusts safety scores for skin type (sensitive, oily, dry), allergen matches, and individual ingredient concern profiles.
- **Analysis History**: Every completed analysis is saved to Redis Cloud and retrievable on the History page.
- **Standalone Frontend Build**: Next.js `output: "standalone"` reduces the production bundle from ~1 GB to ~39 MB.

---

## 🛠️ Tech Stack

| Layer | Technologies | Description |
|---|---|---|
| **Frontend** | Next.js 14, React, TypeScript, Vanilla CSS, Axios, Zustand | App Router, Google OAuth client, JWT token management via localStorage |
| **Auth** | Google OAuth 2.0, `google-auth` (backend), JWT (access + refresh tokens) | Passwordless authentication — no bcrypt, no email/password |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, `python-jose`, python-multipart | High-performance API server with rate limiting and JWT validation |
| **Agent Orchestration** | LangGraph, LangChain, Google Generative AI (Gemini 3.1 Flash Lite) | Multi-agent StateGraph with conditional routing and retry logic |
| **Vector Embeddings** | FastEmbed (`sentence-transformers/all-MiniLM-L6-v2` via ONNX) | Lightweight CPU-only inference — no PyTorch dependency |
| **Vector Database** | Qdrant Cloud | Semantic search across 68 seeded cosmetic ingredients |
| **Cache & Sessions** | Redis Cloud | User sessions, analysis history (unlimited retention), rate limiting |
| **Web Search Fallback** | Tavily Python SDK | Live web search for ingredients not in the Qdrant database |

---

## 📁 Project Structure

```
Cosmet/
├── backend/                      # FastAPI API server
│   ├── app/
│   │   ├── api/                  # API routes (auth, analysis, history, profile)
│   │   │   ├── routes/auth.py    # /google, /refresh, /me, /logout endpoints
│   │   │   └── deps.py           # JWT bearer token dependency injection
│   │   ├── core/                 # Config and JWT token utilities
│   │   │   ├── config.py         # Settings (Qdrant, Redis, Gemini, Google OAuth)
│   │   │   └── security.py       # create_access_token, create_refresh_token, decode_token
│   │   ├── models/               # Pydantic schemas (UserResponse, Token, GoogleLoginRequest)
│   │   ├── services/
│   │   │   ├── agents/           # LangGraph agent nodes
│   │   │   │   ├── supervisor.py       # Workflow routing & invalid_product termination
│   │   │   │   ├── research_agent.py   # Qdrant lookup + Tavily fallback
│   │   │   │   ├── analysis_agent.py   # Gemini-powered report generation
│   │   │   │   └── critic_agent.py     # 6-gate quality validation
│   │   │   ├── graph/
│   │   │   │   ├── state.py      # AnalysisState TypedDict (incl. invalid_product)
│   │   │   │   └── workflow.py   # StateGraph compilation & run_analysis()
│   │   │   ├── embeddings/
│   │   │   │   ├── generate_embeddings.py  # FastEmbed TextEmbedding wrapper
│   │   │   │   └── upload_to_qdrant.py     # Database seeding utility
│   │   │   ├── tools/
│   │   │   │   └── mcp_tools.py  # ingredient_lookup, safety_scorer, allergen_matcher, tavily_search
│   │   │   └── memory/
│   │   │       ├── redis_client.py  # user:profile, user:history Redis operations
│   │   │       └── session.py       # Short-term session manager
│   │   └── main.py               # FastAPI app entry point
│   ├── requirements.txt          # Python dependencies (fastembed, no torch/sentence-transformers)
│   └── runtime.txt               # python-3.12
│
├── frontend/                     # Next.js App Router SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/     # Google Sign-In page
│   │   │   ├── (dashboard)/      # Protected analyze, history, profile pages
│   │   │   └── page.tsx          # Root redirect (auth check → /analyze or /login)
│   │   ├── components/
│   │   │   └── auth/LoginForm.tsx # Google OAuth button + callback handler
│   │   ├── store/authStore.ts    # Zustand auth state (loginWithGoogle, logout, checkAuth)
│   │   ├── hooks/useAuth.ts      # Auth hook wrapping authStore
│   │   ├── lib/
│   │   │   ├── api.ts            # Axios instance with JWT interceptors & auto-refresh
│   │   │   ├── auth.ts           # localStorage token/user helpers
│   │   │   └── validations.ts    # Zod profileSchema (login/register schemas removed)
│   │   └── types/auth.ts         # User, AuthResponse interfaces (no LoginCredentials/RegisterData)
│   ├── next.config.ts            # output: "standalone" for lean production builds
│   └── vercel.json               # Vercel deployment config
│
├── scripts/                      # Utility and verification scripts
│   ├── test_simple_workflow.py   # 4-ingredient cosmetic analysis test
│   ├── test_relevance_gate.py    # Energy drink rejection test (non-cosmetic gate)
│   └── test_complete_workflow.py # Full scenario test
│
├── README.md
├── DEPLOYMENT.md
└── WORKFLOW_EXPLAINER.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+
- Qdrant Cloud cluster URL & API key
- Redis Cloud connection URI
- Google Cloud project with OAuth 2.0 Client ID
- Gemini API key (`GOOGLE_API_KEY`)
- Tavily API key

### Backend Setup

1. **Navigate to backend and create virtual environment**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install requirements**:
   ```bash
   pip install -r requirements.txt
   ```
   > **Note**: This installs `fastembed==0.5.1` (ONNX Runtime). PyTorch is **not** required.

3. **Configure Environment Variables** — create `backend/.env`:
   ```env
   SECRET_KEY=your_super_secret_jwt_key_min_32_chars
   GOOGLE_API_KEY=your_gemini_api_key
   GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
   TAVILY_API_KEY=your_tavily_api_key
   QDRANT_URL=https://your-cluster.gcp.qdrant.io:6333
   QDRANT_API_KEY=your_qdrant_api_key
   REDIS_URL=redis://default:password@your-redis-endpoint:port
   ```

4. **Seed the Qdrant Database** (first time only):
   ```bash
   python3 ../scripts/populate_ingredient_details.py
   ```

5. **Start the API Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend and install**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment Variables** — create `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing & Validation

```bash
# Test the 4-agent cosmetic analysis workflow (Niacinamide, Glycerin, Hyaluronic Acid, Water)
python3 scripts/test_simple_workflow.py

# Test the Product Relevance Gate — verify energy drink ingredients are rejected
python3 scripts/test_relevance_gate.py

# Full multi-scenario test (beginner, sensitive skin, expert, allergen matching)
python3 scripts/test_complete_workflow.py
```

---

## 📦 Deployment

Full step-by-step instructions are in [DEPLOYMENT.md](./DEPLOYMENT.md).

- **Backend**: Deploys to **Render** (Web Service, Python 3.12, `backend/` root directory).
- **Frontend**: Deploys to **Vercel** (Next.js, `frontend/` root directory, standalone output).

---

## 🙏 Acknowledgments

- **Google Gemini Team** — Gemini 3.1 Flash Lite API access.
- **LangChain / LangGraph** — Multi-agent orchestration framework.
- **Qdrant Team** — Vector database + FastEmbed library.
- **Tavily** — AI-optimized web search API.
- **Data Sources:**
  - [incidecoder.com](https://incidecoder.com/) — Ingredient purposes and descriptions.
  - [cosmeticsinfo.org](https://www.cosmeticsinfo.org/) — Safety information.
  - [EWG Skin Deep](https://www.ewg.org/skindeep/) — Safety scores and ratings.

*Built with ❤️ by Cosmet*

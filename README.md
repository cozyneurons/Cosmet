# Cosmet - Cosmetic Ingredient Analyzer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.0-black.svg)](https://nextjs.org/)
[![Gemini 3.1 Flash Lite](https://img.shields.io/badge/Gemini-3.1%20Flash%20Lite-orange.svg)](https://ai.google.dev/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-green.svg)](https://github.com/langchain-ai/langgraph)

> **A multi-agent AI system that analyzes cosmetic ingredients in under 10 seconds, delivering personalized safety assessments based on user allergies and skin type. Migrated from Streamlit to a production-ready React (Next.js) + FastAPI stack.**

From 20 minutes of manual research to 10 seconds of validated, personalized analysis.

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

It was originally built as a Streamlit MVP and has been migrated to a modern, decoupled production architecture featuring a high-performance **FastAPI backend** and a premium, responsive **Next.js (React + TypeScript)** frontend.

---

## 🏗️ Architecture

```
                                  ┌───────────────────────────┐
                                  │      Next.js Frontend     │
                                  │   (React + TypeScript)    │
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
                            Vector DB     │               │  Cache, Sessions
                            Queries       │               │  & Rate Limits
                                          ▼               ▼
                                   ┌────────────┐   ┌────────────┐
                                   │Qdrant Cloud│   │Redis Cloud │
                                   │ (Vector)   │   │  (Cache)   │
                                   └────────────┘   └────────────┘
```

### Agent specifications (LangGraph Orchestration)
1. **Supervisor Agent:** Orchestrates the workflow and handles retry logic (max 2 retries).
2. **Research Agent:** Performs semantic search using Qdrant and falls back to Tavily Web Search when confidence is low or ingredients are unrecognized.
3. **Analysis Agent:** Adapts responses based on user expertise levels (Beginner vs Expert) and flags ingredients matching user allergy profiles.
4. **Critic Agent:** Conducts quality assurance. Rejects incomplete reports and sends them back to the Analysis agent with feedback.

---

## ✨ Key Features

- **Decoupled Modern Stack**: High-performance FastAPI backend with built-in token-bucket rate limiting and JWT auth.
- **Premium Frontend UX**: Next.js App Router, TailwindCSS layout, custom dark mode aesthetics, loading skeletons, responsive cards, and real-time state visualization.
- **Real-Time Analysis Updates**: WebSocket stream transmitting intermediate agent logs directly to a progress bar during execution.
- **Form Validations**: Complete client-side validations via Zod schemas and React Hook Form.
- **Security Protections**: HTTPS encryption, CORS security settings, secure HTTPOnly Cookies, and token-based credentials.
- **Observability**: Complete LangSmith tracing configuration.

---

## 🛠️ Tech Stack

| Layer | Technologies | Description |
|---|---|---|
| **Frontend** | React 19, Next.js 15, TypeScript, TailwindCSS v4, Axios, Lucide React, Sonner | Premium UI/UX, client-side routing, hooks and state management |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, PyJWT, Passlib, python-multipart | High-performance API server, rate limiting, and JWT authentication |
| **Agent Orchestration**| LangGraph, LangChain, Google Generative AI (Gemini 3.1 Flash Lite) | Multi-agent state logic and Gemini API integrations |
| **Vector DB** | Qdrant Cloud | Vector search for common cosmetics ingredients |

## 📁 Project Structure

```
Cosmet/
├── backend/                      # FastAPI API server
│   ├── app/
│   │   ├── api/                  # Auth and analysis API routes
│   │   ├── core/                 # Config, security, and dependencies
│   │   ├── models/               # Pydantic schemas
│   │   ├── services/             # Agent, database, OCR, and session logic
│   │   │   ├── agents/           # LangGraph agents (Supervisor, Research, Analysis, Critic)
│   │   │   ├── graph/            # LangGraph workflow graphs and states
│   │   │   ├── embeddings/       # Embedding generation & database seed loaders
│   │   │   └── tools/            # Custom FastMCP tools (Ingredient lookup, safety scorer)
│   │   ├── utils/                # Rate limiter and helper classes
│   │   └── main.py               # Server entry point
│   ├── requirements.txt          # Python dependencies
│   ├── Procfile                  # Render start command
│   ├── runtime.txt               # Python runtime version
│
├── frontend/                     # React Next.js SPA
│   ├── src/
│   │   ├── app/                  # Next.js App Router (Dashboard, Analyze, Auth)
│   │   ├── components/           # Custom components (AnalysisResults, forms, skeletons)
│   │   ├── hooks/                # Custom hooks (auth, toast wrappers)
│   │   ├── lib/                  # API client and form validation schemas
│   │   └── types/                # TypeScript interface declarations
│   ├── package.json              # NPM dependencies & scripts
│   ├── jest.config.js            # Frontend testing settings
│   └── vercel.json               # Vercel deployment configurations
│
├── bin/                          # Binary utilities
│   └── qdrant                    # Local Qdrant server binary (macOS arm64 native)
│
├── data/                         # Local database storage
│   ├── processed/                # Pre-processed cosmetic ingredients datasets
│   │   ├── ingredients_final.json
│   │   └── ingredients_with_embeddings.json
│   └── qdrant_storage/           # Local Qdrant DB vector storage
│
├── scripts/                      # Utility and verification test scripts
│   ├── populate_ingredient_details.py # Gemini-powered database populator & vector seeder
│   ├── test_simple_workflow.py   # Simple 2-agent safety analysis test scenario
│   ├── test_complete_workflow.py # Full 4-agent safety analysis test scenario
│   └── test_all_scenarios.py     # Aggregated test scenarios runner
│
└── test-integration.sh           # End-to-end API integration tests
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+
- Qdrant Cloud (or running local instance) and Redis Cloud credentials

### 1. Database Setup (Local Qdrant)
Start the local Qdrant server instance using the pre-compiled native macOS Apple Silicon binary pointing to the pre-populated local storage folder:
```bash
# From the project root directory
QDRANT__STORAGE__STORAGE_PATH="data/qdrant_storage/storage" ./bin/qdrant
```
*The local Qdrant server will run and listen at `http://localhost:6333`.*

### 2. Backend Setup
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

3. **Configure Environment Variables**:
   Create a `backend/.env` file:
   ```bash
   SECRET_KEY=your_super_secret_jwt_key
   GOOGLE_API_KEY=your_gemini_api_key
   TAVILY_API_KEY=your_tavily_api_key
   QDRANT_URL=http://localhost:6333
   QDRANT_API_KEY=
   REDIS_URL=redis://localhost:6379/0
   ```

4. **Start the API Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 3. Frontend Setup

1. **Navigate to frontend**:
   ```bash
   cd ../frontend
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `frontend/.env.local` file:
   ```bash
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000
   ```

3. **Run Developer Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing & Validation

### 1. Verification Scripts (Root)
Ensure the local Qdrant server is running, then execute any of the verification scripts from the root directory:
```bash
# Test the basic supervisor routing and research agent retrieval
python3 scripts/test_simple_workflow.py

# Test the complete 4-agent cycle (Supervisor -> Research -> Analysis -> Critic) under allergen rules
python3 scripts/test_complete_workflow.py

# Run the complete agent analysis workflow against all scenarios (Beginner, Sensitive, Expert)
python3 scripts/test_all_scenarios.py
```

### 2. Populating/Re-seeding the Database
If you need to re-seed or populate missing ingredient details (e.g., purpose, description, EWG safety score) dynamically using the Gemini API and regenerate vector embeddings:
```bash
python3 scripts/populate_ingredient_details.py
```
*(This script includes automated rate limiting and skips already-populated ingredients to prevent API issues).*

### 3. End-to-End API Integration Testing
Run the root integration test shell script, which automatically verifies backend API auth flows and agent analysis pipelines:
```bash
./test-integration.sh
```

---

## 📦 Deployment

Complete step-by-step setup, custom domains, monitoring, and cost considerations are documented in [DEPLOYMENT.md](file:///Users/shubhamkumar/Desktop/Cosmet/DEPLOYMENT.md).

- **Backend**: Deploys to Render via Web Services (linked via `backend/Procfile` and `backend/render.yaml`).
- **Frontend**: Deploys to Vercel (linked via `frontend/vercel.json`).

---

## 🙏 Acknowledgments

- **AI Agents Intensive** - Capstone project framework and guidance.
- **Google Gemini Team** - Gemini 3.1 Flash Lite API access.
- **LangChain/LangGraph** - Multi-agent orchestration framework.
- **Qdrant Team** - Vector database for semantic search.
- **Data Sources:**
  - [incidecoder.com](https://incidecoder.com/) - Ingredient purposes and descriptions.
  - [cosmeticsinfo.org](https://www.cosmeticsinfo.org/) - Safety information.
  - [EWG Skin Deep](https://www.ewg.org/skindeep/) - Safety scores and ratings.

*Built with ❤️ by Cosmet*

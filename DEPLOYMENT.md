# Cosmet - Deployment Guide

This guide details the step-by-step instructions for deploying **Cosmet** (Cosmetic Ingredient Analyzer) to production, featuring a Next.js frontend on Vercel and a FastAPI backend on Render.

---

## 🏗️ Production Architecture

| Layer | Service | Notes |
|---|---|---|
| **Frontend** | Vercel | Next.js 14, standalone output (~39 MB) |
| **Backend API** | Render (Web Service) | FastAPI, Python 3.12, Uvicorn |
| **Vector Database** | Qdrant Cloud | 68 seeded cosmetic ingredients, 384-dim vectors |
| **Cache & Sessions** | Redis Cloud | User profiles, analysis history, rate limiting |
| **Auth** | Google OAuth 2.0 | Passwordless — no bcrypt, no email/password |
| **Embeddings** | FastEmbed (ONNX) | Ships with the backend, no GPU required |
| **Web Search Fallback** | Tavily API | Triggered when Qdrant confidence < 0.7 |

---

## 🛠️ Step 1: Cloud Database Setup

### 1. Qdrant Cloud
1. Log in to [Qdrant Cloud Console](https://cloud.qdrant.io).
2. Create a new cluster (Free Tier — 1 GB storage / 0.5 vCPU is sufficient).
3. Copy the **Cluster URL** (e.g., `https://xxxxxx.gcp.qdrant.io:6333`) and generate an **API Key**.
4. After deployment, seed the database from your local machine:
   ```bash
   cd backend
   source venv/bin/activate
   QDRANT_URL=https://your-cluster.gcp.qdrant.io:6333 QDRANT_API_KEY=your_key python3 ../scripts/populate_ingredient_details.py
   ```

### 2. Redis Cloud
1. Log in to [Redis Cloud](https://redis.com/try-free/).
2. Create a Free Tier database (30 MB is sufficient).
3. Copy the connection URI from database settings:
   ```
   redis://default:YOUR_PASSWORD@YOUR_REDIS_ENDPOINT:PORT
   ```

---

## ⚡ Step 2: Backend Deployment (Render)

### Deployment Files
Ensure these files exist in `backend/`:

**`backend/Procfile`**:
```procfile
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**`backend/runtime.txt`**:
```
python-3.12
```

### Deployment Steps
1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com) → **New** → **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. Add **Environment Variables** in the Render dashboard:

| Key | Value | Description |
|---|---|---|
| `SECRET_KEY` | *(generate a 32+ char random string)* | Signs JWT access & refresh tokens |
| `GOOGLE_API_KEY` | *(Gemini API key)* | Powers all 4 LangGraph agents |
| `GOOGLE_CLIENT_ID` | *(OAuth 2.0 Client ID)* | Verifies Google ID tokens on `/auth/google` |
| `TAVILY_API_KEY` | *(Tavily API key)* | Web search fallback for unknown ingredients |
| `QDRANT_URL` | `https://xxxxxx.gcp.qdrant.io:6333` | Qdrant Cloud cluster endpoint |
| `QDRANT_API_KEY` | *(Qdrant API key)* | Authentication for vector store access |
| `REDIS_URL` | `redis://default:password@endpoint:port` | Redis Cloud connection URI |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | JWT refresh token lifetime |

6. Click **Deploy Web Service**. Backend will be live at `https://cosmet-api.onrender.com`.

> **Note**: The first deploy downloads the FastEmbed ONNX model (~22 MB). Subsequent starts use the Render build cache.

---

## 🖥️ Step 3: Frontend Deployment (Vercel)

### `next.config.ts`
The frontend uses `output: "standalone"` to produce a lean production bundle:
```ts
const nextConfig = {
  output: "standalone",
};
export default nextConfig;
```
This reduces the build artifact from ~1 GB to ~39 MB.

### `frontend/vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Deployment Steps
1. Log in to [Vercel](https://vercel.com) → **Add New** → **Project**.
2. Select your GitHub repository.
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Next.js`
4. Add **Environment Variables** in the Vercel dashboard:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://cosmet-api.onrender.com` |
| `NEXT_PUBLIC_WS_URL` | `wss://cosmet-api.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | *(Your Google OAuth 2.0 Client ID)* |

5. Click **Deploy**. Frontend will be live at `https://cosmet.vercel.app`.

---

## 🔐 Step 4: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**.
2. Create an **OAuth 2.0 Client ID** (Web Application type).
3. Add **Authorized JavaScript Origins**:
   ```
   https://cosmet.vercel.app
   http://localhost:3000
   ```
4. Add **Authorized Redirect URIs** (not required for the implicit flow, but good practice):
   ```
   https://cosmet.vercel.app/login
   ```
5. Copy the **Client ID** into both the Render (`GOOGLE_CLIENT_ID`) and Vercel (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`) environment variables.

---

## 🔒 Step 5: Security Hardening

### CORS Configuration
In `backend/app/core/config.py`, verify CORS origins match your production URL:
```python
BACKEND_CORS_ORIGINS = [
    "https://cosmet.vercel.app",
    "https://your-custom-domain.com",
    "http://localhost:3000",
]
```

### Trusted Host Middleware (Optional)
In `backend/app/main.py`:
```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["cosmet-api.onrender.com", "your-custom-domain.com", "localhost"]
)
```

---

## 🩺 Step 6: Monitoring

### Sentry (Backend Error Tracking)
```bash
pip install sentry-sdk[fastapi]
```
In `backend/app/main.py`:
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```
Add `SENTRY_DSN` to Render environment variables.

### Vercel Analytics
Toggle on in the Vercel dashboard under **Analytics** — no code changes needed.

---

## 🔄 Step 7: Backup & Maintenance

### Qdrant Snapshot
```bash
# Snapshot the cosmetic_ingredients collection
curl -X POST https://your-cluster.gcp.qdrant.io:6333/collections/cosmetic_ingredients/snapshots \
  -H "api-key: YOUR_QDRANT_API_KEY"
```

### Re-seeding the Database
If you need to add new ingredients or re-seed from scratch:
```bash
cd backend
python3 ../scripts/populate_ingredient_details.py
```
The script skips already-populated ingredients and applies automated rate limiting.

### Rollbacks
- **Backend (Render)**: Deployments → locate last stable commit → **Rollback**.
- **Frontend (Vercel)**: Deployments → locate stable deployment → **Promote to Production**.

---

## 🚨 Troubleshooting

### FastEmbed model download fails on Render
The model is downloaded on first run. If it times out:
- Increase Render's build timeout.
- Or pre-download and cache it in your Docker image if using a custom Dockerfile.

### WebSocket Disconnection (`code 1006`)
- Ensure `NEXT_PUBLIC_WS_URL` uses `wss://` (not `ws://`) in production.
- Render free tier instances sleep after inactivity — hit the `/health` endpoint to wake them.

### Google OAuth `invalid_grant` Error
- Double-check the `GOOGLE_CLIENT_ID` in both Render and Vercel matches the same Google Cloud credential.
- Ensure your Vercel domain is listed under **Authorized JavaScript Origins** in Google Cloud Console.

### CORS Errors
- Confirm `NEXT_PUBLIC_API_URL` has **no trailing slash**.
- Add the Vercel deployment URL (including any preview URLs) to `BACKEND_CORS_ORIGINS` in `config.py`.

### Qdrant Low Confidence (All Ingredients Falling Back to Tavily)
- The database may not be seeded. Run `populate_ingredient_details.py` against your production Qdrant cluster.
- Verify `QDRANT_URL` and `QDRANT_API_KEY` are correctly set in Render environment variables.

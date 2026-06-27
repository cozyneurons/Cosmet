# Cosmet - Deployment Guide

This guide details the step-by-step instructions for deploying the **Cosmet** (Cosmetic Ingredient Analyzer) system to production, featuring a Next.js (React + TypeScript) frontend and a FastAPI backend.

---

## 🏗️ Production Architecture

- **Frontend**: Next.js App Router (React + TypeScript) deployed on **Vercel**.
- **Backend API**: FastAPI (Python 3.12) deployed on **Render** as a Web Service.
- **Vector Database**: **Qdrant Cloud** (free tier/paid cluster) for semantic ingredient searches.
- **Cache & Session Stores**: **Redis Cloud** for JWT blocklists, rate limiting, and short-term analysis sessions.
- **Monitoring**: **Sentry** (for FastAPI application exceptions) + **Vercel Analytics** & **Google Analytics** (for frontend interaction tracking) + **LangSmith** (for agent decision traces).

---

## 🛠️ Step 1: Database Setup

### 1. Qdrant Cloud Setup
1. Log in to [Qdrant Cloud Console](https://cloud.qdrant.io).
2. Create a new cluster (use the Free Tier - 1GB storage / 0.5 vCPU).
3. Generate and record the **API Key** and the **Cluster URL** (e.g., `https://xxxxxx-xxxxxx.gcp.qdrant.io:6333`).
4. Keep the credentials handy for backend environment variables.

### 2. Redis Cloud Setup
1. Log in to [Redis Cloud](https://redis.com/try-free/).
2. Create a new subscription and database (use the Free Tier - 30MB).
3. Retrieve the Redis connection URI under the database settings:
   ```
   redis://default:YOUR_PASSWORD@YOUR_REDIS_ENDPOINT:PORT
   ```
4. Note the connection URI for the backend configuration.

---

## ⚡ Step 2: Backend Deployment (Render)

The backend code is situated in the `backend/` directory.

### 1. Production Configuration Files
Ensure the following deployment files are present:
- **`backend/Procfile`**:
  ```procfile
  web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- **`backend/runtime.txt`**:
  ```text
  python-3.12
  ```
- **`backend/render.yaml`**: Standard blueprint declaring Render specifications.

### 2. Deployment Steps
1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com).
3. Click **New** > **Web Service**.
4. Connect your GitHub repository.
5. In the service configuration settings:
   - **Name**: `cosmet-api` (or custom name)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add the following **Environment Variables** in the Render console:

| Key | Value | Description |
|---|---|---|
| `PORT` | `8000` | Port for the FastAPI server |
| `SECRET_KEY` | *(Generate a cryptographically secure key)* | Secret key for signing JWT tokens |
| `GOOGLE_API_KEY` | *(Your Gemini API key)* | Credentials to access Gemini models |
| `TAVILY_API_KEY` | *(Your Tavily API key)* | Fallback search API credential |
| `QDRANT_URL` | `https://xxxxxx.gcp.qdrant.io:6333` | Qdrant cluster endpoint |
| `QDRANT_API_KEY` | *(Your Qdrant API key)* | Authn key for vector store access |
| `REDIS_URL` | `redis://default:password@endpoint:port` | Redis connection URL |
| `LANGSMITH_API_KEY` | *(Optional, LangSmith key)* | For tracking agent execution |
| `LANGSMITH_PROJECT` | `cosmet` | Project identifier for LangSmith traces |
| `SENTRY_DSN` | *(Optional, Sentry client key)* | Sentry client integration DSN |

7. Click **Deploy Web Service**. Render will build the environment and host it at `https://cosmet-api.onrender.com`.

---

## 🖥️ Step 3: Frontend Deployment (Vercel)

The frontend is a Next.js single-page application under the `frontend/` directory.

### 1. vercel.json
The frontend project includes `frontend/vercel.json` defining Next.js configurations:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://cosmet-api.onrender.com",
    "NEXT_PUBLIC_WS_URL": "wss://cosmet-api.onrender.com"
  }
}
```

### 2. Deployment Steps
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project** and select your GitHub repository.
3. In the project setup settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Next.js`
   - **Build and Output Settings**: Leave as defaults.
4. Add the **Environment Variables** in the Vercel project dashboard:
   - `NEXT_PUBLIC_API_URL`: `https://cosmet-api.onrender.com` (Your Render backend HTTPS URL)
   - `NEXT_PUBLIC_WS_URL`: `wss://cosmet-api.onrender.com` (Your Render backend WSS WebSocket URL)
5. Click **Deploy**. Vercel will build the Next.js pages and host the frontend at `https://cosmet.vercel.app`.

---

## 🔒 Step 4: Security Hardening

### 1. Enabling HTTPS & WSS
Both Vercel and Render automatically configure free managed Let's Encrypt SSL/TLS certificates. All backend endpoints and WebSocket channels are automatically accessed over secure `https://` and `wss://` protocols.

### 2. CORS Configurations
In `backend/app/core/config.py`, verify that backend origins align with your production URL:
```python
BACKEND_CORS_ORIGINS = [
    "https://cosmet.vercel.app",
    "https://your-custom-domain.com"
]
```

### 3. Allowed Hosts Middleware
In `backend/app/main.py`, you can enable host limits:
```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["cosmet-api.onrender.com", "your-custom-domain.com", "127.0.0.1", "localhost"]
)
```

---

## 🩺 Step 5: Monitoring & Analytics

### 1. Sentry (Error Tracking)
Install the Sentry SDK in your backend dependency:
```bash
pip install sentry-sdk[fastapi]
```
Add initialization to `backend/app/main.py`:
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

### 2. Vercel Web Analytics
Vercel Web Analytics is automatically integrated when toggling it on inside the Vercel dashboard project settings.

### 3. Google Analytics (GA4)
Inject Google Tag scripts dynamically in `frontend/src/app/layout.tsx`:
```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
```

---

## 🔄 Step 6: Backup & Maintenance

### 1. Cache Backups
Redis Cloud takes automatic daily snapshots of cached databases. You can manage storage schedules, backup durations, and replication layers in the Redis Cloud database control settings.

### 2. Vector DB Replications
Qdrant Cloud handles storage persistence and replication strategies natively on cloud clusters. To run a manual local backup:
```bash
# Snapshot a Qdrant collection
curl -X POST http://localhost:6333/collections/ingredients/snapshots
```

### 3. Rollbacks
- **Backend (Render)**: Navigate to the web service dashboard, click **Deployments**, locate the last working commit, and select **Rollback to this deploy**.
- **Frontend (Vercel)**: Select your project on the Vercel dashboard, click **Deployments**, locate the stable deployment, and click **Promote to Production** or **Redeploy**.

---

## 🚨 Troubleshooting

### 1. WebSocket Disconnection (`code 1006`)
- Ensure the connection URI is `wss://` instead of `ws://` in production.
- Confirm Render's HTTP/2 or WebSocket configurations. High latency on Render's free tier can sleep instances; access the `/health` endpoint to wake them up.

### 2. CORS Exceptions
- Double-check that `NEXT_PUBLIC_API_URL` environment variable has no trailing slashes.
- Add the Vercel domain to the `BACKEND_CORS_ORIGINS` list inside the backend environment configurations.

### 3. HuggingFace / Dataset Import Errors
If the server crashes on start:
- Ensure the datasets package version matches `5.0.0` or higher to resolve namespace clashes:
  ```bash
  pip install datasets>=5.0.0
  ```

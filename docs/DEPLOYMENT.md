# Cloud Deployment Guide: PricePilot AI System

This document provides complete instructions for deploying the PricePilot AI system to production cloud providers.

---

## 🏗️ Deployment Strategy: Unified vs. Split

PricePilot AI supports two distinct deployment models:
1. **Unified Deployment (Recommended)**: The built React frontend bundle is served directly by the FastAPI backend as static assets. Requires only **one server** (Render/Railway).
2. **Split Deployment**: The React frontend is hosted on a CDN (Vercel/Netlify) and the FastAPI API runs separately on a cloud server (Render/Railway).

---

## ⚡ Option 1: Unified Deployment on Render

This model is the simplest, most performant, and cost-effective. It uses the `render.yaml` configuration in the root folder.

### Configuration (`render.yaml`)
```yaml
services:
  - type: web
    name: pricepilot-system
    env: python
    buildCommand: "pip install -r requirements.txt && cd frontend && npm install && npm run build"
    startCommand: "uvicorn backend.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: GOOGLE_API_KEY
        sync: false
      - key: DB_HOST
        sync: false
      - key: DB_PORT
        sync: false
      - key: DB_USER
        sync: false
      - key: DB_PASSWORD
        sync: false
      - key: DB_NAME
        sync: false
```

### Steps to Deploy:
1. Push this repository to GitHub or GitLab.
2. Log in to the [Render Dashboard](https://dashboard.render.com).
3. Click **New +** and select **Blueprint**.
4. Select your repository. Render will automatically parse `render.yaml` and prompt you for the values of environment variables.
5. Provide credentials for a database instance (e.g., Render Managed PostgreSQL) and your `GOOGLE_API_KEY`.
6. Click **Deploy**. The build process compiles the React assets, configures Python, and starts the server.

---

## 🌐 Option 2: Split Deployment (Vercel + Render)

Use this option if you want to scale the frontend independently on a global CDN.

### Part A: FastAPI Backend on Render
1. Create a new **Web Service** on Render.
2. Select this repository.
3. Configure:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Set env variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `GOOGLE_API_KEY`).
5. Copy the active service URL (e.g., `https://pricepilot-api.onrender.com`).

### Part B: React Frontend on Vercel
1. Log in to [Vercel](https://vercel.com).
2. Create a new project and import this repository.
3. Configure the **Build & Development Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Configure **Environment Variables**:
   - Set `VITE_API_URL` to your Render backend URL (e.g., `https://pricepilot-api.onrender.com`).
5. Click **Deploy**. Vercel will host the compiled client assets.

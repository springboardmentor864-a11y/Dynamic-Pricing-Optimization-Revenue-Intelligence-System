# Installation Guide: PricePilot AI System

This document outlines the step-by-step procedure to set up, install, and initialize the PricePilot AI system locally.

---

## 📋 Prerequisites
Before continuing, verify that your machine has the following tools installed:
1. **Python 3.10+** (verify with `python --version`)
2. **Node.js 18+** & **npm** (verify with `node -v` and `npm -v`)
3. **Docker** & **Docker Compose v2** (verify with `docker compose version`)
4. **PostgreSQL 14+** (if running a local database outside of Docker)

---

## 🛠️ Option 1: One-Command Startup (Recommended)
The easiest way to run the entire stack (React Frontend + FastAPI Backend + PostgreSQL Database) is via Docker Compose:

1. **Verify configuration file exists**: Make sure you have a `.env` file copied from `.env.example`.
2. **Start the containers**:
   ```bash
   docker compose up --build
   ```
3. **Access application views**:
   - **Frontend application**: Go to [http://localhost](http://localhost) (mapped on Nginx port 80).
   - **FastAPI backend swagger docs**: Go to [http://localhost:8000/docs](http://localhost:8000/docs).
4. **Shut down containers**:
   ```bash
   docker compose down -v
   ```

---

## 🐍 Option 2: Manual Local Development Setup
If you need to debug the code directly without container boundaries, follow the manual workflow:

### Step 1: Initialize Database
Ensure a local PostgreSQL instance is running on your machine.
Create a database named `pricepilot_ai`.
Confirm connection parameters in your local `.env` file match:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=pricepilot_ai
```

### Step 2: Backend Setup
1. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```
2. Activate the virtual environment:
   - **Windows PowerShell**: `.\venv\Scripts\Activate.ps1`
   - **Mac/Linux Bash**: `source venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run ML Model Pre-training (builds models & saves pickle metrics):
   ```bash
   python -m backend.ml.train_models
   ```
5. Start backend development server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
   Swagger APIs will load at [http://localhost:8000/docs](http://localhost:8000/docs).

### Step 3: Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the indicated address (usually [http://localhost:5173](http://localhost:5173)).

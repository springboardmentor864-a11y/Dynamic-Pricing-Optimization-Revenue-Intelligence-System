# PricePilot AI – Dynamic Pricing Optimization & Revenue Intelligence System

PricePilot AI is an enterprise-grade SaaS platform built using Python (FastAPI), React (Vite + JavaScript), and multiple Machine Learning and time-series forecasting models. It assists businesses in optimizing margins and forecast demand using real-time data integrations.

---

## 🌟 Key Features

1. **User Management & RBAC**
   - User account registration and JWT authentication.
   - Role-Based Access Control (Admin, Pricing Manager, Sales Team, Executive).
   - Secure client route protection.

2. **Product Catalog & Data Integration**
   - Full CRUD endpoints persist updates to CSV records on-the-fly.
   - Robust CSV import parser handles data anomalies and performs clean feature engineering.

3. **AI Price Predictor Engine**
   - Predicts optimal prices, suggests recommended pricing actions (`Increase`, `Decrease`, `Maintain`), and gauges confidence metrics.
   - Prefills historical metrics and supports What-If scenario simulations.

4. **Demand Forecasting Engine**
   - Projects inventory requirements over 6 discrete horizons: 7 days, 14 days, 30 days, 3 months, 6 months, and 12 months.
   - Automatically maps historical sales logs and forecasted targets inside a unified trendline visualization.

5. **Competitor & Market Intelligence**
   - Analyzes store pricing against market indexes.
   - Alerts on pricing outliers using Isolation Forest algorithms.
   - Identifies margin opportunities and pricing headspace.

6. **Automated Business Reporting**
   - Renders live simulation area charts for Revenue, Sales, and Profit.
   - Exports dynamially generated spreadsheets for Store Revenue, Competitor Audits, and AI recommendations.

---

## 🛠 Tech Stack

* **Frontend**: React, Vite, Recharts, Lucide Icons, Tailwind CSS
* **Backend**: FastAPI (Python 3.11+), PyJWT, Uvicorn, Statsmodels, Prophet, XGBoost, Scikit-Learn, Pandas, NumPy
* **DevOps**: Docker, Docker Compose

---

## 🚀 Quick Start (Local Development)

### Prerequisites
Make sure Python 3.11+ and Node.js are installed on your local system.

### 1. Run the Backend Server
Navigate to the `backend/` folder:
```bash
cd backend
# Create and activate virtual environment
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Unix:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start local server
uvicorn app:app --reload
```
The FastAPI documentation will be available at `http://127.0.0.1:8000/docs`.

### 2. Run the Frontend Client
Navigate to the `frontend/` folder in a new terminal:
```bash
cd frontend
# Install dependencies
npm install

# Start local hot-reloader
npm run dev
```
The application will run on `http://localhost:5173`.

---

## 🐳 Docker Deployment

To build and run the entire stack inside containerised environments:
```bash
# Build and start services in detached mode
docker-compose up -d --build
```
- **Frontend App**: `http://localhost`
- **Backend API**: `http://localhost:8000`

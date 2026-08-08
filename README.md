# 🚀 PricePilot AI – Double Ultimate Master Enterprise Documentation

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-Extra--Trees-F7931E.svg)](https://scikit-learn.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon--Cloud-4169E1.svg)](https://neon.tech/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#)

> **PricePilot AI** is an enterprise-grade artificial intelligence dynamic pricing and demand forecasting SaaS platform developed for the **Infosys Springboard 7.0 Internship Program (August 2026)**.

---

## 🌟 Key Platform Capabilities

- **AI Dynamic Pricing Engine**: Machine learning model powered by **Extra Trees Regressor** achieving **96.50% R² Score** with sub-50ms inference latency.
- **4-Tier SaaS Architecture**: Decoupled design combining React 19 SPA, FastAPI REST gateway, Scikit-Learn ML service, and Neon PostgreSQL relational database.
- **Enterprise Security Suite**: Multi-layer defense featuring OAuth2 Bearer JWT authentication, Bcrypt password hashing (12 rounds), 6-digit OTP password reset, and OWASP security headers.
- **openpyxl Excel Export Subsystem**: Admin capability generating native `.xlsx` workbooks with custom header styling (#1E3A8A), bold white typography, cell borders, freeze panes, and auto-adjusted column widths.
- **ReportLab Master Document Hub**: Automated generation of 24 publication-quality enterprise & academic PDF specifications and presentation slide deck (`.pptx`).

---

## 📊 Machine Learning Model Benchmarks

Six machine learning regression models were trained and benchmarked on historical product shipping transactions:

| Model Name | R² Score | MAE (₹) | RMSE (₹) | Execution Speed | Model Selection Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Extra Trees Regressor** | **0.9650** | **12.40** | **18.60** | **0.045s** | **Selected (Best Model)** |
| **Random Forest Regressor** | 0.9420 | 15.80 | 22.10 | 0.082s | Evaluated Baseline |
| **XGBoost Regressor** | 0.9380 | 16.20 | 23.40 | 0.038s | Evaluated Baseline |
| **Gradient Boosting** | 0.9150 | 19.50 | 27.80 | 0.055s | Evaluated Baseline |
| **Decision Tree Regressor** | 0.8840 | 24.10 | 34.20 | 0.012s | Evaluated Baseline |
| **Linear Regression** | 0.7410 | 42.50 | 58.90 | 0.005s | Evaluated Baseline |

---

## 🛠️ Technology Stack Breakdown

- **Frontend Tier**: React 19, Vite, Tailwind CSS (Glassmorphism), Framer Motion, Axios, Lucide Icons.
- **Backend Tier**: Python 3.13, FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2, Passlib, PyJWT, openpyxl, ReportLab.
- **Database Tier**: Serverless PostgreSQL (Neon Cloud) / SQLite local development DB.
- **Machine Learning**: Scikit-Learn Extra Trees Regressor, Pandas, NumPy, Joblib.
- **DevOps & Cloud**: Docker Containerization, Render Web Service, Vercel Edge Hosting.

---

## 🚀 Local Installation & Quick Start

### 1. Backend Setup
```bash
cd PricePilot_AI/backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Unix: source venv/bin/activate
pip install -r requirements.txt
python generate_all_docs.py  # Generates 24 enterprise PDF & PPTX files
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd PricePilot_AI/frontend
npm install
npm run dev
```

The application will be accessible at:
- Frontend Client: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/docs`

---

## 👥 Authoring Team & Credits

**Infosys Springboard 7.0 Internship Capstone Team**:
- **Narendar Reddy**: Lead Full Stack Architect & openpyxl Export Engine
- **Manvitha**: Machine Learning Engineer & Extra Trees Model Optimization
- **Pravallika**: Frontend UI/UX Specialist & Glassmorphic Design
- **Ashwindh**: Backend & DevOps Engineer (PostgreSQL & Docker)

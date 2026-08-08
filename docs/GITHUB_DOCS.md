# PricePilot AI – Enterprise GitHub Documentation & Workflow Specification

Welcome to the official **PricePilot AI** GitHub Repository Documentation. This guide details repository conventions, branch strategies, issue tracking procedures, PR guidelines, and CI/CD pipelines for Infosys Springboard 7.0 contributors.

---

## 1. Repository Structure Overview

```
PricePilot_AI/
├── app.py                     # Streamlit Demo Interface
├── requirements.txt           # Python Production Dependencies
├── pricepilot.db              # SQLite Local Development Database
├── backend/                   # FastAPI Production REST Backend
│   ├── main.py                # Application Entry Point & Middleware
│   ├── database.py            # SQLAlchemy Session & DB Engine
│   ├── models.py              # ORM Relational Schema Definitions
│   ├── schemas.py             # Pydantic Data Validation Schemas
│   ├── security.py            # Bcrypt & JWT Security Implementation
│   ├── seed.py                # Database Initialization & Seeding
│   ├── generate_all_docs.py   # ReportLab PDF & PPTX Deck Generator
│   ├── routers/               # Microservice Endpoint Routers
│   │   ├── auth.py            # Registration, Login & OTP Verification
│   │   ├── predict.py         # Extra Trees ML Inference Router
│   │   ├── users.py           # Admin User CRUD & openpyxl Exporter
│   │   ├── dashboard.py       # Analytics & Key System Metrics
│   │   └── docs.py            # Document Hub & Download Router
│   └── static/documents/      # Compiled Enterprise PDF & PPTX Files
├── frontend/                  # React 19 + Vite Frontend SPA
│   ├── src/
│   │   ├── App.jsx            # React Router & Glassmorphic Shell
│   │   ├── pages/             # Interactive Application Views
│   │   ├── components/        # Reusable UI Elements & Navigation
│   │   └── context/           # React AuthContext State Management
│   └── package.json           # Frontend Node Dependencies
├── trained_models/            # Serialized ML Models
│   └── best_price_model.pkl   # Extra Trees Regressor Binary (.pkl)
├── dataset/                   # Cleaned & Engineered Datasets
└── docs/                      # Enterprise Documentation Specs
```

---

## 2. Git Branching Strategy (GitFlow)

PricePilot AI follows a strict GitFlow branching framework:

- `main` / `master`: Production-ready release branch. Deployed to Vercel & Render.
- `develop`: Staging integration branch. All feature branches merge here via PR.
- `feature/<feature-name>`: Dedicated feature branch (e.g. `feature/jwt-otp-auth`).
- `bugfix/<issue-id>`: Patch branch for resolving QA issues.
- `release/v2.0`: Staging branch for final release candidate testing.

---

## 3. Pull Request (PR) Requirements

Before submitting a Pull Request to `develop`:

1. **Clean Automated Build**: Run `npm run build` in `/frontend` to verify 0 TypeScript/JSX compilation errors.
2. **Pytest Verification**: Execute `pytest` in `/backend` to verify all unit tests pass.
3. **PEP 8 Compliance**: Code must be formatted using `black` or `flake8`.
4. **PR Review Approval**: Requires approval from at least two team code reviewers.

---

## 4. Release Tagging & Versioning

Releases follow Semantic Versioning (`MAJOR.MINOR.PATCH`):
- `v1.0.0`: Initial prototype release for Infosys Springboard Phase 1.
- `v2.0.0`: Enterprise production release featuring Extra Trees ML (96.5% R²), openpyxl Excel exporter, 6-digit OTP verification, and ReportLab master document hub.

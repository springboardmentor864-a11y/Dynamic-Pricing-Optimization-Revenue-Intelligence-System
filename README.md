# PricePilot AI: Dynamic Pricing Optimization & Revenue Intelligence System

PricePilot AI is an enterprise-grade, full-stack artificial intelligence platform built for **Dynamic Pricing Optimization, Demand Forecasting, Competitor Intelligence, and Revenue Maximization**.

It combines a **production ML pipeline** (trained on 100,000+ e-commerce orders) with a **Flask REST API backend**, **JWT Role-Based Access Control (RBAC)**, **3NF Normalized Database Schema**, **Automated PDF/Excel/CSV Report Generation**, and a **Glassmorphism Single-Page Web Dashboard**.

---

## 1. Project Overview
PricePilot AI solves the challenge of static, intuition-based pricing in e-commerce. By modeling price elasticity, customer willingness to pay, competitor price movements, and cost structure constraints, PricePilot AI automatically determines the optimal selling price for every SKU in a catalog to maximize net profit and gross margin while preserving sales volume.

Key Capabilities:
- Real-time Price Elasticity & Demand Forecasting ($R^2 = 0.942$)
- Time-Series Competitor Radar & Price Comparison
- Statistical Market Volatility & Opportunity Detection
- Profit Maximization under Cost & Margin Floor Constraints
- Interactive What-If Scenario Simulator
- Automated Multi-Format Report Generation (PDF, Excel, CSV)
- Executive C-Suite BI & System Health Monitoring

---

## 2. Key Features
- **AI Price Engine**: Instant price prediction based on item weight, dimensions, category, and freight values using Extra Trees, XGBoost, LightGBM, and CatBoost regressor ensembles.
- **Demand Forecasting**: 30-day rolling daily unit demand forecasting with 85%-115% confidence interval bounds.
- **Competitor Radar**: Automated competitor mapping, time-series price ledgers, price gap calculations, position status flags (*Lowest*, *Competitive*, *Above Market*, *Overpriced*), and CSV bulk feed imports.
- **Market Intelligence Engine**: Calculates 7d/14d/30d rolling moving averages, price standard deviation, Volatility Index ($V$), and inverse Market Stability Score ($S = 100 - V$).
- **Revenue Engine & 8 AI Pricing Playbooks**: Replaces volume-only pricing with profit optimization. Automatically generates 8 specialized strategies (*Aggressive Pricing*, *Competitive Matching*, *Premium Pricing*, *Margin Protection*, *Market Penetration*, *Revenue Maximization*, *Demand Recovery*, *Loss Prevention*).
- **Interactive What-If Scenario Simulator**: Real-time slider-based scenario modeling (Price Adjustment %, Competitor Move %, Cost Inflation %, Demand Multiplier) rendering an 11-point net profit sensitivity curve.
- **Executive BI Platform**: C-Suite KPI aggregation, Financial Lift Waterfall Charts, Strategy Distribution Treemaps, and Category Level Financial Drill-downs.
- **Multi-Format Report Exporter**: Dynamic, live database-driven PDF (via ReportLab), Excel (via OpenPyXL), and CSV exports across 8 executive report types.
- **Active Business Notification Alerts**: Auto-detects and prioritizes *Margin Risk*, *Competitor Price Cut*, and *High Opportunity* alerts.
- **System Monitoring**: Live diagnostics tracking database pool status, ML model health, server latency (ms), and process RAM (MB).

---

## 3. Technology Stack
- **Frontend**: HTML5, Vanilla JavaScript (ES6+ async/await), Glassmorphism CSS Design System, ApexCharts v3.x.
- **Backend API**: Python 3.13, Flask 3.x, Flask-SQLAlchemy, Flask-Bcrypt, PyJWT, Flasgger (OpenAPI/Swagger).
- **Machine Learning**: LightGBM, XGBoost, CatBoost, Extra Trees, Random Forest, Scikit-learn (StandardScaler, OneHotEncoder, Log-transforms), Joblib.
- **Database**: SQLite (default zero-config) / PostgreSQL / MySQL via SQLAlchemy ORM.
- **Reporting Engine**: ReportLab (PDF), Pandas + OpenPyXL (Excel), CSV.
- **DevOps & Testing**: Docker, Docker Compose, Pytest test runner (36 automated tests).

---

## 4. System Architecture

```mermaid
graph TD
    Client[Web Browser / Single Page App] -->|HTTP / REST + JWT| FlaskServer[Flask REST API Server]
    FlaskServer --> Auth[JWT Role-Based Middleware]
    FlaskServer --> Blueprints[15 API Route Blueprints]
    
    Blueprints -->|SQLAlchemy ORM| DB[(3NF SQLite / PostgreSQL Database)]
    Blueprints -->|Live Inference| MLEngine[Gradient Boosted Decision Trees ML Engine]
    Blueprints -->|Market Analytics| MarketEngine[Market Intelligence & Volatility Engine]
    Blueprints -->|Financial Math| RevenueEngine[Revenue Optimization & Elasticity Engine]
    Blueprints -->|PDF/XLSX Export| ReportEngine[ReportLab & OpenPyXL Export Service]
    
    MLEngine -->|Load Models| ModelsDir[outputs/models/best_model.pkl]
    MarketEngine -->|Price Ledgers| DB
    RevenueEngine -->|Elasticity Q(P)| DB
```

---

## 5. Folder Structure

```
Price-Pilot-AI/
├── .env.example                # Environment variables template
├── .gitignore                  # Git exclusions rules
├── Dockerfile                  # Containerization image definition
├── README.md                   # System documentation & developer guide
├── docker-compose.yml          # Multi-container orchestration config
├── run.py                      # Production WSGI server entrypoint
├── web_app.py                  # Local development web server (http://127.0.0.1:5000)
├── app/                        # Flask Application Package
│   ├── __init__.py             # App Factory & Blueprint Registration
│   ├── config.py               # App & JWT Configuration Settings
│   ├── models.py               # 3NF Normalized SQLAlchemy Database Models
│   ├── auth.py                 # JWT Tokens, Password Hashing & RBAC Decorators
│   ├── api/                    # 15 REST API Route Blueprints
│   │   ├── auth_routes.py      # Authentication (/register, /login, /profile)
│   │   ├── pricing_routes.py   # AI Inference (/predict-price, /forecast-demand, /optimize-price)
│   │   ├── dashboard_routes.py # Dashboard KPIs & Visualizations
│   │   ├── product_routes.py   # Product Catalog CRUD
│   │   ├── competitor_routes.py# Competitor Radar & CSV Import
│   │   ├── market_routes.py    # Volatility & Trend Analytics
│   │   ├── revenue_routes.py   # Revenue Optimization & Simulation
│   │   ├── bi_routes.py        # Executive BI KPIs & Drill-downs
│   │   ├── report_routes.py     # PDF, Excel, CSV Exports
│   │   ├── alert_routes.py     # Business Alerts & Acknowledgement
│   │   ├── monitoring_routes.py# System Health Diagnostics
│   │   └── health_routes.py    # Application Readiness Probes
│   ├── services/               # Core Business Logic Services
│   │   ├── ml_service.py       # Model Loader & Inference Engine
│   │   ├── competitor_service.py# Competitor Price Ledger Service
│   │   ├── comparison_engine.py# Real-time Price Comparison Engine
│   │   ├── market_intelligence_engine.py # Market Volatility & Stability Analytics
│   │   ├── trend_engine.py     # Rolling Averages & Trend Analytics
│   │   ├── revenue_optimization_engine.py # Elasticity & Profit Maximization
│   │   ├── pricing_strategy_engine.py # 8 AI Pricing Playbooks
│   │   ├── simulation_engine.py# What-If Scenario Simulator
│   │   ├── executive_bi_service.py # C-Suite KPI & Drill-down Aggregator
│   │   ├── executive_report_service.py # ReportLab PDF & OpenPyXL Excel Generator
│   │   ├── alert_service.py    # Business Alert Trigger Engine
│   │   ├── monitoring_service.py# Database Pool & Latency Monitor
│   │   └── seeder.py           # Automatic Database Initializer & Seeder
│   ├── static/                 # Glassmorphism Frontend Web Assets
│   │   ├── css/style.css       # Design System & Responsive CSS
│   │   └── js/                 # API Client, ApexCharts Engine & SPA Controller
│   └── templates/
│       └── index.html          # Single Page Web Dashboard Interface
├── src/                        # ML Pipeline Training & Evaluation Package
├── tests/                      # Pytest Test Suite (36 Automated Unit/Integration Tests)
├── data/                       # Data inputs directory
├── outputs/                    # Serialized ML Models (outputs/models/best_model.pkl) & Reports
└── notebooks/                  # Jupyter notebooks for EDA & benchmarking
```

---

## 6. Database Overview (3NF Normalized)

The database schema is fully normalized in **Third Normal Form (3NF)** with strict foreign keys, indexes, and cascade constraints:

1. **`users`**: User account management with role authorization (`Admin`, `Pricing Manager`, `Business Analyst`).
2. **`categories`**: Taxonomy hierarchy and translations.
3. **`products`**: Product catalog with dimensions, weights, cost prices, target margins, and min/max boundaries.
4. **`competitors`**: External retailer profiles with website URLs and trust scores.
5. **`competitor_categories`**: Competitor taxonomy mapping.
6. **`competitor_products`**: Mapping linking internal product SKUs to external competitor SKUs.
7. **`competitor_prices`**: Time-series historical price ledger observations.
8. **`price_recommendations`**: AI strategy recommendations, expected profit lift, and confidence scores.
9. **`demand_forecasts`**: Daily unit demand projections and upper/lower bounds.
10. **`orders`**: Master purchase order records.
11. **`audit_logs`**: System security and API activity audit trail.

---

## 7. Machine Learning Pipeline

The ML pipeline is trained on historical Brazilian e-commerce transaction data:

- **Preprocessing**: Feature scaling (`StandardScaler`), categorical encoding (`OneHotEncoder`), log-transformation of skewed price distributions.
- **Feature Vector**: `product_weight_g`, `product_length_cm`, `product_height_cm`, `product_width_cm`, `freight_value`, `category_code`.
- **Ensemble Regressors**:
  - **Extra Trees Regressor**: Best accuracy ($R^2 = 0.9904$, $\text{RMSE} = 20.46$)
  - **LightGBM Regressor**: Fast inference ($R^2 = 0.9703$)
  - **XGBoost Regressor**: High stability ($R^2 = 0.9709$)
  - **CatBoost Regressor**: Categorical feature handling ($R^2 = 0.9679$)
- **Price Elasticity Demand Equation**:
  $$Q(P) = Q_0 \left(\frac{P}{P_0}\right)^E \quad (E = -1.8)$$
- **Optimization Model**:
  $$P_{\text{opt}} = \arg\max_{P} \left( (P - \text{cost}) \cdot Q(P) \right) \quad \text{s.t.} \quad P_{\text{min}} \le P \le P_{\text{max}}$$

---

## 8. API Overview & Specifications

### 🔑 Auth API (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT | Public |
| `GET` | `/api/auth/profile` | Fetch authenticated user profile | Protected |

### 🤖 Pricing & Inference API (`/api/pricing`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/pricing/predict-price` | Predict optimal price using ML model | Protected |
| `POST` | `/api/pricing/forecast-demand` | Generate 30-day demand forecast | Protected |
| `POST` | `/api/pricing/optimize-price` | Compute price elasticity curve & optimal price | Protected |

### 📦 Product Catalog API (`/api/products`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/products` | List paginated products with search filter | Public |
| `POST` | `/api/products` | Create new product | Protected |
| `PUT` | `/api/products/<id>` | Update product details & cost structure | Protected |
| `DELETE` | `/api/products/<id>` | Delete product from catalog | Protected |

### 🔍 Competitor Radar API (`/api/competitors`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/competitors` | List all tracked competitors | Public |
| `POST` | `/api/competitors/prices` | Ingest single competitor price observation | Protected |
| `POST` | `/api/competitors/import/csv` | Bulk import price feed CSV file | Protected |
| `GET` | `/api/competitors/comparison` | Compute price comparison & position summary | Public |

### 📈 Market Intelligence API (`/api/market`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/market/overview` | Catalog volatility scores & market summary | Public |
| `GET` | `/api/market/trends` | 7d/30d rolling averages & trend direction | Public |
| `GET` | `/api/market/opportunities` | Auto-detected pricing opportunities | Public |

### 💰 Revenue Optimization API (`/api/revenue`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/revenue/overview` | Catalog revenue & net profit lift totals | Public |
| `GET` | `/api/revenue/recommendations` | AI pricing strategy recommendations | Public |
| `POST` | `/api/revenue/simulate` | Interactive What-If scenario simulation | Public |

### 🏛️ Executive BI & Reporting API (`/api/bi`, `/api/reports`, `/api/alerts`, `/api/monitoring`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/bi/overview` | C-Suite executive KPIs & positioning matrix | Public |
| `GET` | `/api/bi/drilldown` | Multi-dimensional category & product drill-down | Public |
| `GET` | `/api/reports/export` | Export reports (`PDF`, `Excel`, `CSV`) for 8 report types | Public |
| `GET` | `/api/alerts` | Query active business alerts | Public |
| `POST` | `/api/alerts/acknowledge` | Acknowledge active business alert | Public |
| `GET` | `/api/monitoring/health` | System health, DB pool, latency, memory | Public |

---

## 9. Installation Guide

### Prerequisites
- Python 3.10, 3.11, 3.12, or 3.13
- Git
- Pip package manager

### Step-by-Step Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Akhils696/Price-Pilot-AI.git
   cd Price-Pilot-AI
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

---

## 10. Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default `.env` configuration:
```env
SECRET_KEY=pricepilot-ai-super-secret-key-2026
JWT_SECRET_KEY=pricepilot-jwt-secret-key-2026
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=pricepilot_db
DATABASE_URL=sqlite:///instance/pricepilot.db
```

---

## 11. Running the Backend & Web Application

Start the application server:
```bash
python web_app.py
```
Open your browser at **`http://127.0.0.1:5000`**

### Pre-Seeded Test Accounts:
- **Admin**: `admin@pricepilot.ai` / `admin123`
- **Pricing Lead**: `pricing@pricepilot.ai` / `pricing123`
- **Business Analyst**: `analyst@pricepilot.ai` / `analyst123`

---

## 12. Running the Frontend
The single-page Web Dashboard interface is served directly by the Flask application via `app/templates/index.html` and assets in `app/static/`. Simply navigate to `http://127.0.0.1:5000` after running `python web_app.py`.

---

## 13. Running with Docker

### Using Docker Compose (Recommended)
```bash
docker-compose up --build
```
Access the application at `http://localhost:5000`.

### Using Docker CLI
```bash
docker build -t pricepilot-ai .
docker run -p 5000:5000 pricepilot-ai
```

---

## 14. Running Automated Tests

Run the complete 36-test suite using Pytest:
```bash
python -m pytest tests/ -v
```
Output: `36 passed in ~25.0s (100% success rate)`

---

## 15. Project Workflow

```
[ Data Ingestion / CSV Feed ]
             │
             ▼
[ 3NF Relational Database ] ──► [ Market Intelligence Engine ]
             │                             │
             ▼                             ▼
[ Trained ML Regressors ] ──► [ Revenue Optimization Engine ]
                                           │
                                           ▼
                                 [ 8 AI Strategy Playbooks ]
                                           │
                                           ▼
                                 [ What-If Simulator ]
                                           │
                                           ▼
                           [ Executive BI & Multi-Format Reports ]
```

---

## 16. Milestone Progress

- **Milestone 1**: Data Pipeline, Data Cleaning, EDA, Feature Engineering & ML Baseline Models. *(Completed)*
- **Milestone 2**: ML Model Evaluation, Hyperparameter Tuning, Flask REST API & Web Dashboard. *(Completed)*
- **Milestone 3**: Competitor Monitoring, Market Intelligence Engine, Revenue Optimization, What-If Simulator, Executive BI Dashboard, Multi-Format PDF/Excel/CSV Report Export & System Health Diagnostics. *(Completed)*

---

## 17. Screenshots & Interface Placeholders

- **Overview Dashboard**: `outputs/plots/overview_dashboard.png` (Landing page with 8 KPI cards & ML Leaderboard)
- **AI Price Engine**: `outputs/plots/ai_price_engine.png` (Optimal price predictor & demand forecaster)
- **Competitor Radar**: `outputs/plots/competitor_radar.png` (Price comparison table & CSV import modal)
- **Market Intelligence**: `outputs/plots/market_intelligence.png` (Volatility index & rolling trend charts)
- **Revenue Engine**: `outputs/plots/revenue_engine.png` (What-If simulator sliders & sensitivity curve)
- **Executive BI**: `outputs/plots/executive_bi.png` (Waterfall lift chart, strategy treemap & report export modal)

---

## 18. Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `OperationalError: no such column` | Old SQLite database file schema | Delete `instance/pricepilot.db` and restart `python web_app.py` to auto-rebuild and seed. |
| `Port 5000 in use` | Previous server process running | Terminate background process or change port in `web_app.py`. |
| `ModuleNotFoundError` | Virtual environment not active | Activate virtual environment (`venv\Scripts\activate` or `source venv/bin/activate`). |

---

## 19. Common Errors & Fixes
- **`401 Unauthorized`**: JWT token missing or expired. Log in again at `/api/auth/login` to obtain a fresh access token.
- **`400 Bad Request on CSV Import`**: Invalid CSV headers. Ensure CSV contains headers: `competitor_name`, `competitor_sku`, `internal_sku`, `price`.

---

## 20. Production Deployment Guide
For enterprise production deployment:
1. Set environment variable `DATABASE_URL` pointing to PostgreSQL or MySQL.
2. Launch server using production WSGI worker (`gunicorn -w 4 -b 0.0.0.0:5000 run:app`).
3. Place Nginx as reverse proxy with SSL/TLS certificate termination.

---

## 21. Future Improvements
- Multi-currency conversion engine (BRL, USD, EUR).
- Real-time WebSocket push notifications for competitor price drops.
- Reinforcement learning (Q-Learning) agent for automated autonomous repricing.

---

## 22. Contributors
- **Isha** — Solution Architect, Lead Engineer & ML Developer

---

## 23. License
This project is licensed under the **MIT License** — free for commercial and non-commercial use.

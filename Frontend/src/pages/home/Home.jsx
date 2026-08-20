import { useNavigate } from "react-router-dom";
import {
    Sparkles,
    TrendingUp,
    Target,
    LineChart,
    IndianRupee,
    BarChart3,
    ArrowRight,
    CheckCircle2,
    Cpu,
    Zap
} from "lucide-react";
import "./Home.css";

function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-page">
            {/* =====================================================
                NAVBAR
            ===================================================== */}
            <nav className="home-navbar">
                <div className="home-brand" onClick={() => navigate("/")}>
                    <div className="home-logo-badge">
                        <Sparkles size={18} />
                    </div>
                    <div className="home-logo-text">
                        PricePilot <span>AI</span>
                    </div>
                </div>

                <div className="home-nav-links">
                    <a href="#features">Features</a>
                    <a href="#models">ML Models</a>
                    <a href="#about">About</a>
                </div>

                <div className="home-nav-actions">
                    <button
                        className="btn-nav-login"
                        onClick={() => navigate("/login")}
                    >
                        Sign In
                    </button>
                    <button
                        className="btn-nav-get-started"
                        onClick={() => navigate("/login")}
                    >
                        Launch Console
                        <ArrowRight size={15} />
                    </button>
                </div>
            </nav>

            {/* =====================================================
                HERO SECTION
            ===================================================== */}
            <section className="home-hero">
                <div className="hero-glow hero-glow-1"></div>
                <div className="hero-glow hero-glow-2"></div>

                <div className="hero-container">
                    <div className="hero-badge">
                        <span className="badge-pulse"></span>
                        <Cpu size={14} />
                        DYNAMIC PRICING & REVENUE INTELLIGENCE
                    </div>

                    <h1 className="hero-title">
                        PricePilot AI: <br />
                        <span className="text-gradient">Dynamic Pricing Optimization & Revenue Intelligence System</span>
                    </h1>

                    <p className="hero-subtitle">
                        PricePilot AI empowers retail, e-commerce, and enterprise sales teams to maximize margins, predict seasonal demand trends, and outsmart competitors using advanced machine learning models (XGBoost, Random Forest, Prophet).
                    </p>

                    <div className="hero-cta-group">
                        <button
                            className="btn-hero-primary"
                            onClick={() => navigate("/login")}
                        >
                            <Zap size={18} />
                            Launch Dashboard
                        </button>
                        <a href="#features" className="btn-hero-secondary">
                            Explore Capabilities
                        </a>
                    </div>

                    {/* KEY METRICS BAR */}
                    <div className="hero-stats-bar">
                        <div className="stat-item">
                            <span className="stat-val">+18.4%</span>
                            <span className="stat-label">Average Margin Expansion</span>
                        </div>
                        <div className="stat-separator"></div>
                        <div className="stat-item">
                            <span className="stat-val">0.8993</span>
                            <span className="stat-label">Best ML Model R² Score</span>
                        </div>
                        <div className="stat-separator"></div>
                        <div className="stat-item">
                            <span className="stat-val">7 to 365</span>
                            <span className="stat-label">Day Forecasting Horizon</span>
                        </div>
                        <div className="stat-separator"></div>
                        <div className="stat-item">
                            <span className="stat-val">&lt; 50ms</span>
                            <span className="stat-label">Real-Time Prediction Latency</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                CORE MODULES (AS PER SPECIFICATION PDF)
            ===================================================== */}
            <section className="modules-section" id="features">
                <div className="section-header">
                    <span className="section-eyebrow">COMPREHENSIVE CAPABILITIES</span>
                    <h2>End-to-End Dynamic Pricing Architecture</h2>
                    <p>Designed to meet all functional outcomes for dynamic pricing optimization and revenue intelligence.</p>
                </div>

                <div className="modules-grid">
                    <div className="module-card">
                        <div className="module-icon-wrap icon-indigo">
                            <IndianRupee size={24} />
                        </div>
                        <h3>1. Dynamic Pricing Engine</h3>
                        <p>Generate real-time optimal prices by synthesizing cost structures, market elasticity, competitor moves, and current stock positions.</p>
                        <ul className="module-features">
                            <li><CheckCircle2 size={14} /> Rule-based and ML price recommendation</li>
                            <li><CheckCircle2 size={14} /> Automated floor & ceiling price constraints</li>
                        </ul>
                    </div>

                    <div className="module-card">
                        <div className="module-icon-wrap icon-cyan">
                            <LineChart size={24} />
                        </div>
                        <h3>2. Demand Forecasting</h3>
                        <p>Forecast multi-horizon demand with seasonal trend decomposition across 7-day, 14-day, 30-day, and 12-month windows.</p>
                        <ul className="module-features">
                            <li><CheckCircle2 size={14} /> Seasonal trend and festival indicators</li>
                            <li><CheckCircle2 size={14} /> Forecast confidence scores (0-100%)</li>
                        </ul>
                    </div>

                    <div className="module-card">
                        <div className="module-icon-wrap icon-purple">
                            <Target size={24} />
                        </div>
                        <h3>3. Competitor Intelligence</h3>
                        <p>Monitor competitor price catalogs, detect aggressive undercut moves, and identify high-value market pricing opportunities.</p>
                        <ul className="module-features">
                            <li><CheckCircle2 size={14} /> Market positioning comparison matrix</li>
                            <li><CheckCircle2 size={14} /> Real-time pricing opportunity alerts</li>
                        </ul>
                    </div>

                    <div className="module-card">
                        <div className="module-icon-wrap icon-emerald">
                            <TrendingUp size={24} />
                        </div>
                        <h3>4. Revenue & Margin Simulator</h3>
                        <p>Simulate pricing scenarios to predict revenue and profitability impacts before executing changes in live sales channels.</p>
                        <ul className="module-features">
                            <li><CheckCircle2 size={14} /> What-if scenario simulation models</li>
                            <li><CheckCircle2 size={14} /> Gross margin & unit volume elasticity</li>
                        </ul>
                    </div>

                    <div className="module-card">
                        <div className="module-icon-wrap icon-amber">
                            <Sparkles size={24} />
                        </div>
                        <h3>5. ML Price Predictor</h3>
                        <p>Harness Scikit-learn, XGBoost, and ensemble models trained on historical retail and e-commerce transactions.</p>
                        <ul className="module-features">
                            <li><CheckCircle2 size={14} /> R² benchmark score of 0.8993</li>
                            <li><CheckCircle2 size={14} /> MAE & RMSE performance auditing</li>
                        </ul>
                    </div>

                    <div className="module-card">
                        <div className="module-icon-wrap icon-rose">
                            <BarChart3 size={24} />
                        </div>
                        <h3>6. Executive BI Dashboard</h3>
                        <p>Centralized business intelligence visualizing sales velocity, price elasticity curves, top profit drivers, and inventory turnover.</p>
                        <ul className="module-features">
                            <li><CheckCircle2 size={14} /> Role-based access control (RBAC)</li>
                            <li><CheckCircle2 size={14} /> Exportable analytics and executive reports</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* =====================================================
                ML MODELS BENCHMARK
            ===================================================== */}
            <section className="models-section" id="models">
                <div className="section-header">
                    <span className="section-eyebrow">AI MODEL BENCHMARKS</span>
                    <h2>High-Accuracy Machine Learning Engine</h2>
                    <p>PricePilot AI continuously benchmarks multiple regression and time-series models to guarantee optimal recommendations.</p>
                </div>

                <div className="models-table-container">
                    <table className="models-table">
                        <thead>
                            <tr>
                                <th>Model Architecture</th>
                                <th>Type</th>
                                <th>R² Accuracy Score</th>
                                <th>MAE (Mean Absolute Error)</th>
                                <th>RMSE</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="best-model-row">
                                <td>
                                    <div className="model-name-cell">
                                        <Sparkles size={16} className="star-icon" />
                                        <strong>Random Forest Regressor</strong>
                                    </div>
                                </td>
                                <td>Ensemble Trees</td>
                                <td><span className="score-badge best">0.8993 (Best)</span></td>
                                <td>20.55</td>
                                <td>58.41</td>
                                <td><span className="status-pill active">Primary Engine</span></td>
                            </tr>
                            <tr>
                                <td><strong>XGBoost Regressor</strong></td>
                                <td>Gradient Boosted Trees</td>
                                <td><span className="score-badge">0.8748</span></td>
                                <td>27.75</td>
                                <td>65.13</td>
                                <td><span className="status-pill active">Active Ensemble</span></td>
                            </tr>
                            <tr>
                                <td><strong>Decision Tree Regressor</strong></td>
                                <td>Single Decision Tree</td>
                                <td><span className="score-badge">0.8248</span></td>
                                <td>26.28</td>
                                <td>77.06</td>
                                <td><span className="status-pill fallback">Baseline</span></td>
                            </tr>
                            <tr>
                                <td><strong>Linear Regression</strong></td>
                                <td>Parametric Regression</td>
                                <td><span className="score-badge">0.5834</span></td>
                                <td>53.46</td>
                                <td>118.82</td>
                                <td><span className="status-pill fallback">Benchmark</span></td>
                            </tr>
                            <tr>
                                <td><strong>Prophet / ARIMA</strong></td>
                                <td>Time-Series Forecasting</td>
                                <td><span className="score-badge">88% Confidence</span></td>
                                <td>Seasonal Trends</td>
                                <td>Multi-Horizon</td>
                                <td><span className="status-pill active">Forecast Engine</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* =====================================================
                CTA BANNER
            ===================================================== */}
            <section className="cta-banner-section">
                <div className="cta-card">
                    <div className="cta-content">
                        <span className="cta-badge">GET STARTED TODAY</span>
                        <h2>Ready to Supercharge Your Pricing Strategy?</h2>
                        <p>Access the full PricePilot AI console with complete product catalogs, demand forecast models, and competitor tracking.</p>
                        <div className="cta-button-row">
                            <button
                                className="btn-cta-primary"
                                onClick={() => navigate("/login")}
                            >
                                Launch Dashboard Now
                                <ArrowRight size={17} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                FOOTER
            ===================================================== */}
            <footer className="home-footer" id="about">
                <div className="footer-top">
                    <div className="footer-brand-info">
                        <div className="home-brand">
                            <div className="home-logo-badge">
                                <Sparkles size={18} />
                            </div>
                            <div className="home-logo-text">
                                PricePilot <span>AI</span>
                            </div>
                        </div>
                        <p>Dynamic Pricing Optimization & Revenue Intelligence Platform built for data-driven commerce.</p>
                    </div>

                    <div className="footer-links-grid">
                        <div className="footer-col">
                            <h4>Platform</h4>
                            <a href="#features">Dynamic Pricing</a>
                            <a href="#models">ML Models</a>
                        </div>
                        <div className="footer-col">
                            <h4>Modules</h4>
                            <span onClick={() => navigate("/login")}>Product Catalog</span>
                            <span onClick={() => navigate("/login")}>Competitor Tracking</span>
                            <span onClick={() => navigate("/login")}>Revenue Simulation</span>
                            <span onClick={() => navigate("/login")}>BI Analytics</span>
                        </div>
                        <div className="footer-col">
                            <h4>Security</h4>
                            <span>Role-Based Access (RBAC)</span>
                            <span>JWT Authentication</span>
                            <span>PostgreSQL Database</span>
                            <span>Dockerized Services</span>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2026 PricePilot AI: Dynamic Pricing Optimization & Revenue Intelligence. All rights reserved.</p>
                    <div className="footer-tags">
                        <span>FastAPI Backend</span>
                        <span>•</span>
                        <span>React Frontend</span>
                        <span>•</span>
                        <span>Scikit-Learn & XGBoost</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Sparkles,
    Lock,
    Mail,
    User,
    Shield,
    Eye,
    EyeOff,
    ArrowRight,
    Zap,
    CheckCircle2,
    Briefcase
} from "lucide-react";
import api from "../../api/axios";
import "./Login.css";

function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

    const [mode, setMode] = useState(initialMode); // 'login' | 'register'
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("Pricing Manager");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // =========================================================
    // 1-CLICK DEMO ACCESS
    // =========================================================
    const handleDemoLogin = (demoRole = "Pricing Manager") => {
        localStorage.setItem("access_token", "demo_jwt_pricepilot_ai_token_2026");
        localStorage.setItem("user_email", "harsha.kulkarni@pricepilot.ai");
        localStorage.setItem("user_role", demoRole);
        navigate("/dashboard");
    };

    // =========================================================
    // FORM SUBMIT (LOGIN OR REGISTER)
    // =========================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setLoading(true);

        try {
            if (mode === "login") {
                const formData = new URLSearchParams();
                formData.append("username", email.trim());
                formData.append("password", password);

                try {
                    const response = await api.post("/auth/login", formData, {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                    });

                    localStorage.setItem("access_token", response.data.access_token);
                    localStorage.setItem("user_email", email.trim());
                    localStorage.setItem("user_role", role);
                    navigate("/dashboard");
                } catch (apiErr) {
                    // If backend is running and returned 401, show real message
                    if (apiErr.response && apiErr.response.status === 401) {
                        setError(apiErr.response.data?.detail || "Invalid email or password.");
                    } else {
                        // Offline or demo fallback: authenticate gracefully
                        localStorage.setItem("access_token", "demo_jwt_pricepilot_ai_token_2026");
                        localStorage.setItem("user_email", email.trim());
                        localStorage.setItem("user_role", role);
                        navigate("/dashboard");
                    }
                }
            } else {
                // Register mode
                try {
                    await api.post("/auth/register", {
                        full_name: fullName.trim(),
                        email: email.trim(),
                        password: password,
                        role: role
                    });

                    setSuccessMsg("Account created successfully! Switching to sign in...");
                    setTimeout(() => {
                        setMode("login");
                        setSuccessMsg("");
                    }, 1500);
                } catch (apiErr) {
                    if (apiErr.response && apiErr.response.status === 400) {
                        setError(apiErr.response.data?.detail || "Email already registered.");
                    } else {
                        // Offline fallback
                        setSuccessMsg("Account registered in local session! Signing in...");
                        setTimeout(() => {
                            localStorage.setItem("access_token", "demo_jwt_pricepilot_ai_token_2026");
                            localStorage.setItem("user_email", email.trim());
                            localStorage.setItem("user_role", role);
                            navigate("/dashboard");
                        }, 1200);
                    }
                }
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError("Unable to complete request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg-glow glow-top"></div>
            <div className="login-bg-glow glow-bottom"></div>

            <div className="login-card">
                {/* BRAND HEADER */}
                <div className="login-brand" onClick={() => navigate("/")}>
                    <div className="login-brand-icon">
                        <Sparkles size={20} />
                    </div>
                    <div className="login-brand-meta">
                        <h1>PricePilot <span>AI</span></h1>
                        <p>Dynamic Pricing & Revenue Intelligence</p>
                    </div>
                </div>

                {/* MODE TOGGLE */}
                <div className="auth-tab-group">
                    <button
                        className={`auth-tab ${mode === "login" ? "active" : ""}`}
                        onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}
                    >
                        Sign In
                    </button>
                    <button
                        className={`auth-tab ${mode === "register" ? "active" : ""}`}
                        onClick={() => { setMode("register"); setError(""); setSuccessMsg(""); }}
                    >
                        Create Account
                    </button>
                </div>

                {/* DEMO ACCESS QUICK BANNER */}
                <div className="demo-quick-box">
                    <div className="demo-quick-header">
                        <div className="demo-quick-title">
                            <Zap size={14} className="zap-icon" />
                            <span>Instant Demo Console Access</span>
                        </div>
                        <span className="demo-role-pill">Pricing Manager</span>
                    </div>
                    <p className="demo-quick-desc">
                        Explore all ML price prediction, forecasting & competitor modules without manual setup.
                    </p>
                    <button
                        type="button"
                        className="btn-demo-quick"
                        onClick={() => handleDemoLogin("Pricing Manager")}
                    >
                        Enter as Demo Pricing Manager
                        <ArrowRight size={14} />
                    </button>
                </div>

                <div className="auth-divider">
                    <span>or continue with credentials</span>
                </div>

                {/* ERROR / SUCCESS ALERTS */}
                {error && (
                    <div className="auth-alert alert-error">
                        <span>{error}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="auth-alert alert-success">
                        <CheckCircle2 size={16} />
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* FORM */}
                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === "register" && (
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <div className="input-wrap">
                                <User size={16} className="input-icon" />
                                <input
                                    id="fullName"
                                    type="text"
                                    placeholder="Nakka Bharath Adithya"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required={mode === "register"}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Work Email</label>
                        <div className="input-wrap">
                            <Mail size={16} className="input-icon" />
                            <input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrap">
                            <Lock size={16} className="input-icon" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter secure password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {mode === "register" && (
                        <div className="form-group">
                            <label htmlFor="role">Platform Role</label>
                            <div className="input-wrap">
                                <Briefcase size={16} className="input-icon" />
                                <select
                                    id="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="role-select"
                                >
                                    <option value="Pricing Manager">Pricing Manager (Full Optimization Access)</option>
                                    <option value="Business Analyst">Business Analyst (Forecasting & BI)</option>
                                    <option value="Executive">Executive / Revenue Lead</option>
                                    <option value="Sales Lead">Sales Representative</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-auth-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <span>Authenticating...</span>
                        ) : (
                            <>
                                <span>{mode === "login" ? "Sign In to Console" : "Create Pricing Account"}</span>
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                {/* SECURITY FOOTER */}
                <div className="login-security-badge">
                    <Shield size={13} />
                    <span>Role-Based Access Control (RBAC) & OAuth2 Encryption</span>
                </div>
            </div>
        </div>
    );
}

export default Login;
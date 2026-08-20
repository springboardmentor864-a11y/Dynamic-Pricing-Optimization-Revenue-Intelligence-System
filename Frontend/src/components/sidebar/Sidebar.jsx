import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Package,
    TrendingUp,
    Target,
    History,
    Sparkles,
    FileSpreadsheet,
    LineChart,
    IndianRupee,
    BarChart3,
    LogOut,
    ShieldCheck,
    ChevronRight
} from "lucide-react";
import "./Sidebar.css";

function Sidebar() {
    const navigate = useNavigate();

    const menuItems = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: LayoutDashboard,
            badge: "Executive",
        },
        {
            name: "Products",
            path: "/products",
            icon: Package,
        },
        {
            name: "Sales",
            path: "/sales",
            icon: TrendingUp,
        },
        {
            name: "Competitors",
            path: "/competitors",
            icon: Target,
        },
        {
            name: "Price History",
            path: "/price-history",
            icon: History,
        },
        {
            name: "Price Prediction",
            path: "/prediction",
            icon: Sparkles,
            badge: "ML",
        },
        {
            name: "Prediction History",
            path: "/prediction-history",
            icon: FileSpreadsheet,
        },
        {
            name: "Demand Forecast",
            path: "/forecast",
            icon: LineChart,
        },
        {
            name: "Dynamic Pricing",
            path: "/pricing",
            icon: IndianRupee,
            badge: "AI",
        },
        {
            name: "BI Analytics",
            path: "/analytics",
            icon: BarChart3,
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_role");
        navigate("/login");
    };

    const userEmail = localStorage.getItem("user_email") || "pricing.manager@pricepilot.ai";
    const userRole = localStorage.getItem("user_role") || "Pricing Manager";
    const userName = userEmail.split("@")[0].replace(".", " ");

    return (
        <aside className="sidebar">
            {/* BRAND HEADER */}
            <div className="sidebar-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
                <div className="brand-logo-wrap">
                    <div className="brand-icon-box">
                        <Sparkles size={20} className="brand-sparkle" />
                    </div>
                    <div className="brand-info">
                        <div className="brand-title">
                            PricePilot <span className="brand-accent">AI</span>
                        </div>
                        <div className="brand-subtitle">
                            Dynamic Pricing Intelligence
                        </div>
                    </div>
                </div>
            </div>

            {/* NAVIGATION LIST */}
            <div className="sidebar-nav-container">
                <div className="nav-section-label">PLATFORM MODULES</div>
                <nav className="sidebar-nav">
                    {menuItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `sidebar-link ${isActive ? "active" : ""}`
                                }
                            >
                                <div className="sidebar-link-content">
                                    <span className="sidebar-icon">
                                        <IconComponent size={18} />
                                    </span>
                                    <span className="sidebar-text">{item.name}</span>
                                </div>
                                {item.badge && (
                                    <span className={`sidebar-badge badge-${item.badge.toLowerCase()}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* AI STATUS & USER FOOTER */}
            <div className="sidebar-footer">
                <div className="ai-status-card">
                    <div className="status-indicator">
                        <span className="status-ping"></span>
                        <span className="status-dot"></span>
                    </div>
                    <div className="status-text-wrap">
                        <div className="status-title">ML Engines Active</div>
                        <div className="status-detail">XGBoost & Prophet v2.4</div>
                    </div>
                </div>

                <div className="user-profile-widget">
                    <div className="user-avatar-pill">
                        <div className="user-avatar">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-meta">
                            <span className="user-name">{userName}</span>
                            <span className="user-role">
                                <ShieldCheck size={11} className="role-icon" />
                                {userRole}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="logout-btn"
                        title="Sign Out"
                        aria-label="Sign Out"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
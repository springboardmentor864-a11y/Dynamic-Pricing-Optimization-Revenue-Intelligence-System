import {
  LayoutDashboard,
  Package,
  Brain,
  Bell,
  BarChart3,
  Users,
  FileText,
  Settings,
  LogOut,
  Sparkles,
  Bot,
  TrendingUp,
  User,
  History,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useEffect, useRef } from "react";
import api from "../services/api";


const menu = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    path: "/products",
    icon: Package,
  },
  {
    name: "Price Alerts",
    path: "/alerts",
    icon: Bell,
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Competitors",
    path: "/competitors",
    icon: Users,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FileText,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
  },
  {
    name: "AI Prediction",
    path: "/price-prediction",
    icon: Brain,
  },
  {
    name: "Forecast",
    path: "/forecast",
    icon: TrendingUp,
  },
  {
    name: "AI Assistant",
    path: "/ai-assistant",
    icon: Bot,
  },
  {
  name: "Profile",
  path: "/profile",
  icon: User,
},
{
  name: "Activity",
  path: "/activity",
  icon: History,
},
];

export default function Sidebar() {
  const navRef = useRef(null);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("sidebar-scroll");

    if (savedScroll && navRef.current) {
      navRef.current.scrollTop = Number(savedScroll);
    }
  }, []);

  const handleScroll = () => {
    if (navRef.current) {
      sessionStorage.setItem(
        "sidebar-scroll",
        navRef.current.scrollTop
      );
    }
  };

  return (
    <aside className="fixed left-0 top-0 w-72 h-screen bg-white border-r border-gray-200 flex flex-col">

      {/* Logo */}
      <div className="px-7 h-24 border-b border-gray-200 flex items-center flex-shrink-0">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg">
            <Sparkles className="text-white" size={24} />
          </div>

          <div>
            <h1 className="font-bold text-2xl text-gray-900">
              PricePilot
            </h1>

            <p className="text-sm text-gray-500">
              AI Pricing Platform
            </p>
          </div>

        </div>

      </div>

      {/* Scrollable Menu */}
      <div className="flex-1 overflow-hidden">

        <nav
          ref={navRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-4 py-6"
        >
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-5 py-4 rounded-xl mb-2 transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-gray-600 hover:bg-gray-100 hover:text-black"
                  }`
                }
              >
                <Icon size={21} />

                <span className="font-medium">
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t flex-shrink-0">



        <button
          onClick={async () => {
            const refreshToken = localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token");
            if (refreshToken) {
              try {
                await api.post("/logout", { refresh_token: refreshToken });
              } catch (e) {
                console.error("Logout API error", e);
              }
            }
            localStorage.removeItem("token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("refresh_token");
            sessionStorage.removeItem("user");
            window.location.href = "/login";
          }}
          className="w-full flex items-center justify-center gap-2 border rounded-xl py-3 hover:bg-red-50 text-gray-700 hover:text-red-600 transition"
        >
          <LogOut size={18} />
          Logout
        </button>

      </div>

    </aside>
  );
}
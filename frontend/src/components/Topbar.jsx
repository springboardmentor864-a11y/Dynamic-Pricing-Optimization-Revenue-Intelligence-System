import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AddProductModal from "./AddProductModal";
import { useData } from "../context/DataContext";
import useClickOutside from "../hooks/useClickOutside";
import api from "../services/api";

import {
  Bell,
  Search,
  Moon,
  Sun,
  Settings,
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle,
  User,
} from "lucide-react";

const pageRoutes = [
  { name: "Dashboard Analytics", path: "/dashboard" },
  { name: "Product Inventory", path: "/products" },
  { name: "AI Price Predictions", path: "/price-prediction" },
  { name: "Demand Forecasting", path: "/forecast" },
  { name: "Competitor Intelligence", path: "/competitors" },
  { name: "Reports Export", path: "/reports" },
  { name: "Activity History Logs", path: "/activity" },
  { name: "Settings Preferences", path: "/settings" },
  { name: "My Profile Info", path: "/profile" },
  { name: "Help Center Docs", path: "/help-center" },
];

export default function Topbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() =>
    JSON.parse(
      localStorage.getItem("user") ||
        sessionStorage.getItem("user") ||
        '{"name":"Tharun","role":"Pricing Manager"}'
    )
  );
  const {
    datasets,
    activeDatasetHash,
    selectDataset,
    darkMode,
    setDarkMode,
    products,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useData();

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(
        JSON.parse(
          localStorage.getItem("user") ||
            sessionStorage.getItem("user") ||
            '{"name":"Tharun","role":"Pricing Manager"}'
        )
      );
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  useClickOutside(searchRef, () => setSearchQuery(""));
  useClickOutside(notificationRef, () => setNotificationOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  // Perform dynamic matching calculations for Phase 11 Search
  const matchingPages = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return pageRoutes.filter((route) =>
      route.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const matchingProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return products
      .filter((p) => {
        const name = p.product || p.name || "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .slice(0, 5);
  }, [searchQuery, products]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-white border-b px-8 h-24 flex items-center">
      <div className="flex justify-between items-center w-full">
        {/* Left Welcome & Dataset Selector */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              Welcome back, {user.name} 👋
            </p>
          </div>
          

        </div>

        {/* Right Area */}
        <div className="flex items-center gap-4">
          {/* Search Wrapper */}
          <div className="relative" ref={searchRef}>
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              placeholder="Search products, pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 pl-11 pr-4 py-3 rounded-xl bg-gray-100 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
            />

            {/* Global Search Results Dropdown */}
            {searchQuery.trim() !== "" && (
              <div className="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border overflow-hidden z-50 max-h-80 overflow-y-auto">
                {matchingPages.length === 0 && matchingProducts.length === 0 ? (
                  <div className="px-4 py-4 text-center text-gray-400 text-sm">
                    No results found
                  </div>
                ) : (
                  <>
                    {matchingPages.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Navigate Pages
                        </div>
                        {matchingPages.map((page) => (
                          <button
                            key={page.path}
                            onClick={() => {
                              navigate(page.path);
                              setSearchQuery("");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-semibold text-slate-700 transition cursor-pointer"
                          >
                            🧭 {page.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {matchingProducts.length > 0 && (
                      <div className="py-2 border-t">
                        <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Product Inventory
                        </div>
                        {matchingProducts.map((prod) => (
                          <button
                            key={prod.id || prod.product}
                            onClick={() => {
                              navigate("/products");
                              setSearchQuery("");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-medium text-slate-700 transition cursor-pointer truncate"
                          >
                            📦 {prod.product || prod.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition text-gray-700 cursor-pointer"
          >
            {darkMode ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setNotificationOpen(!notificationOpen);
                setProfileOpen(false);
              }}
              className="relative w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition cursor-pointer"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border overflow-hidden z-50 animate-fade-in">
                <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50">
                  <h2 className="font-bold text-slate-800 text-base">Notifications</h2>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y">
                  {notifications.length === 0 ? (
                    <div className="px-5 py-8 text-center text-gray-400 text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-5 py-4 hover:bg-slate-50 transition relative flex gap-3 ${
                          !n.read ? "bg-blue-50/20" : ""
                        }`}
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 text-sm">
                            {n.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-gray-400 block mt-2">
                            {n.time}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 justify-start items-center mt-1">
                          {!n.read && (
                            <button
                              onClick={() => markNotificationAsRead(n.id)}
                              className="text-blue-500 hover:text-blue-700 cursor-pointer"
                              title="Mark Read"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(n.id)}
                            className="text-red-400 hover:text-red-600 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Shortcuts */}
          <button
            onClick={() => navigate("/settings")}
            className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition text-gray-700 cursor-pointer"
          >
            <Settings size={20} />
          </button>

          {/* Add Product Shortcut */}
          <button
            onClick={() => setOpenModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold shadow transition cursor-pointer text-sm"
          >
            <Plus size={18} />
            Add Product
          </button>

          {/* Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationOpen(false);
              }}
              className="flex items-center gap-3 ml-2 cursor-pointer"
            >
              {user.profile_image ? (
                <img
                  src={
                    user.profile_image.startsWith("http")
                      ? user.profile_image
                      : `${api.defaults.baseURL.replace("/api", "")}${user.profile_image}`
                  }
                  alt="Profile"
                  className="w-11 h-11 rounded-full border-2 border-blue-500 object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full border-2 border-blue-500 bg-slate-100 flex items-center justify-center text-slate-400">
                  <User size={18} />
                </div>
              )}
              <div className="text-left hidden md:block">
                <h3 className="font-semibold text-slate-800 text-sm">
                  {user.name}
                </h3>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <ChevronDown
                size={16}
                className={`transition ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border overflow-hidden z-50">
                <div className="px-5 py-4 border-b bg-slate-50">
                  <h3 className="font-bold text-gray-800">{user.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{user.role}</p>
                </div>

                <button
                  onClick={() => {
                    navigate("/profile");
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-5 py-3 hover:bg-gray-50 transition cursor-pointer text-sm font-semibold"
                >
                  👤 My Profile
                </button>

                <button
                  onClick={() => {
                    navigate("/settings");
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-5 py-3 hover:bg-gray-50 transition cursor-pointer text-sm font-semibold"
                >
                  ⚙️ Settings
                </button>

                <button
                  onClick={() => {
                    navigate("/help-center");
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-5 py-3 hover:bg-gray-50 transition cursor-pointer text-sm font-semibold"
                >
                  ❓ Help Center
                </button>

                <hr className="border-slate-100" />

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
                    setProfileOpen(false);
                    window.location.href = "/login";
                  }}
                  className="w-full text-left px-5 py-3 text-red-600 hover:bg-red-50 transition cursor-pointer text-sm font-semibold"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddProductModal
        key={openModal ? "open" : "closed"}
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
      />
    </header>
  );
}
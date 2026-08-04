// Global app constants

export const DEFAULT_BASE_URL = "http://127.0.0.1:8000";

export const STORAGE_KEYS = {
  baseUrl: "pricepilot.baseUrl",
  refreshInterval: "pricepilot.refreshInterval",
  theme: "pricepilot.theme",
};

export const DEFAULT_REFRESH_INTERVAL = 60; // seconds

export const NAV_ITEMS = [
  { label: "Dashboard", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Forecast", to: "/forecast" },
  { label: "Recommendations", to: "/recommendations" },
  { label: "Settings", to: "/settings" },
];

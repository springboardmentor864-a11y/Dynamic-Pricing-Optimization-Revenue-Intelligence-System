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

/** Fallback data used whenever the FastAPI backend is unreachable. */
export const DUMMY_PRODUCTS = [
  { id: 1, name: "Aurora Wireless Headphones", price: 189.0, stock: 142, category: "Audio" },
  { id: 2, name: "Nimbus Mechanical Keyboard", price: 129.5, stock: 58, category: "Peripherals" },
  { id: 3, name: "Vertex 4K Monitor 27\"", price: 429.0, stock: 24, category: "Displays" },
  { id: 4, name: "Pulse Fitness Tracker", price: 79.99, stock: 310, category: "Wearables" },
  { id: 5, name: "Lumen Desk Lamp Pro", price: 64.0, stock: 87, category: "Home Office" },
  { id: 6, name: "Cobalt USB-C Hub", price: 49.0, stock: 0, category: "Accessories" },
  { id: 7, name: "Sol Portable SSD 1TB", price: 119.0, stock: 46, category: "Storage" },
  { id: 8, name: "Echo Studio Microphone", price: 219.0, stock: 12, category: "Audio" },
];

export const DUMMY_FORECAST = [
  { date: "Jan", demand: 1240, revenue: 84200, predicted: 1300 },
  { date: "Feb", demand: 1390, revenue: 91800, predicted: 1410 },
  { date: "Mar", demand: 1180, revenue: 79500, predicted: 1250 },
  { date: "Apr", demand: 1620, revenue: 108300, predicted: 1580 },
  { date: "May", demand: 1750, revenue: 121400, predicted: 1710 },
  { date: "Jun", demand: 1930, revenue: 134900, predicted: 1980 },
  { date: "Jul", demand: 2080, revenue: 146200, predicted: 2140 },
  { date: "Aug", demand: 2240, revenue: 158700, predicted: 2310 },
];

export const DUMMY_RECOMMENDATIONS = [
  { id: 1, product: "Aurora Wireless Headphones", current_price: 189.0, recommended_price: 204.0, revenue_gain: 0.081, status: "approved" },
  { id: 2, product: "Nimbus Mechanical Keyboard", current_price: 129.5, recommended_price: 119.0, revenue_gain: 0.034, status: "pending" },
  { id: 3, product: "Vertex 4K Monitor 27\"", current_price: 429.0, recommended_price: 459.0, revenue_gain: 0.062, status: "pending" },
  { id: 4, product: "Pulse Fitness Tracker", current_price: 79.99, recommended_price: 74.5, revenue_gain: -0.012, status: "rejected" },
  { id: 5, product: "Lumen Desk Lamp Pro", current_price: 64.0, recommended_price: 71.0, revenue_gain: 0.047, status: "approved" },
  { id: 6, product: "Sol Portable SSD 1TB", current_price: 119.0, recommended_price: 126.0, revenue_gain: 0.029, status: "pending" },
];

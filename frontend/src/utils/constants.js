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

/**
 * Column order of the raw arrays returned by the FastAPI backend inside `data`.
 * Used to convert every row array into a JavaScript object.
 */
export const PRODUCT_COLUMNS = ["id", "name", "category", "current_price", "cost_price", "stock"];

export const FORECAST_COLUMNS = [
  "id",
  "product_id",
  "forecast_date",
  "predicted_demand",
  "lower_bound",
  "upper_bound",
  "confidence",
  "model_version",
  "created_at",
];

export const RECOMMENDATION_COLUMNS = [
  "id",
  "product_id",
  "current_price",
  "recommended_price",
  "forecasted_demand",
  "competitor_price",
  "reason",
  "generated_at",
];

export const EMPTY_TEXT = "No Data Available";

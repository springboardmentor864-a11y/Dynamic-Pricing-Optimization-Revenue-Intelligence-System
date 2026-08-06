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
export const PRODUCT_COLUMNS = ["id", "name", "price", "stock", "category"];

export const FORECAST_COLUMNS = [
  "id",
  "product_id",
  "forecast_date",
  "forecasted_demand",
  "lower_bound",
  "upper_bound",
  "confidence",
  "model_name",
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
  "created_at",
];

export const EMPTY_TEXT = "No Data Available";

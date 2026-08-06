import axios from "axios";
import {
  DEFAULT_BASE_URL,
  FORECAST_COLUMNS,
  PRODUCT_COLUMNS,
  RECOMMENDATION_COLUMNS,
  STORAGE_KEYS,
} from "../utils/constants";

/** Reads the (user-configurable) backend URL from localStorage. */
export const getBaseUrl = () => {
  if (typeof window === "undefined") return DEFAULT_BASE_URL;
  return window.localStorage.getItem(STORAGE_KEYS.baseUrl) || DEFAULT_BASE_URL;
};

export const setBaseUrl = (url) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEYS.baseUrl, String(url || "").trim());
  }
};

const client = axios.create({ timeout: 10000 });

// Always resolve against the currently configured backend URL. This runs on
// every request (not once at import time) so a change in Settings, or a
// retried request, immediately picks up the latest value.
client.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  return config;
});

/**
 * Network drops, timeouts, and 5xx responses are treated as transient —
 * these are the "intermittent" failures a flaky dev backend or Wi-Fi blip
 * produces. 4xx responses are real errors and are not retried.
 */
const isTransientError = (error) =>
  !error.response || error.code === "ECONNABORTED" || error.response.status >= 500;

// One retry, after a short backoff, for transient failures only.
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    if (!config.__retried && isTransientError(error)) {
      config.__retried = true;
      await new Promise((resolve) => setTimeout(resolve, 500));
      return client(config);
    }
    return Promise.reject(error);
  },
);

/**
 * The backend returns rows as arrays inside `data`.
 * Convert each array row into an object using the given column order.
 * Object rows (if ever returned) are passed through untouched.
 *
 * Column order below matches the SQL schema exactly (verified against the
 * table exports):
 *   products              -> id, name, category, current_price, cost_price, stock
 *   demand_forecasts      -> id, product_id, forecast_date, predicted_demand,
 *                            lower_bound, upper_bound, confidence, model_version, created_at
 *   price_recommendations -> id, product_id, current_price, recommended_price,
 *                            forecasted_demand, competitor_price, reason, generated_at
 */
export const normalizeRows = (payload, columns) => {
  const rows = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];

  return rows
    .map((row) => {
      if (Array.isArray(row)) {
        return columns.reduce((acc, key, i) => {
          acc[key] = row[i] ?? null;
          return acc;
        }, {});
      }
      if (row && typeof row === "object") return row;
      return null;
    })
    .filter(Boolean);
};

export const fetchProducts = async () => {
  const { data } = await client.get("/products");
  return normalizeRows(data, PRODUCT_COLUMNS);
};

export const fetchForecast = async () => {
  const { data } = await client.get("/forecast");
  return normalizeRows(data, FORECAST_COLUMNS);
};

export const fetchRecommendations = async () => {
  const { data } = await client.get("/recommendations");
  return normalizeRows(data, RECOMMENDATION_COLUMNS);
};

export default client;
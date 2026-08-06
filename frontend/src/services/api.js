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

// Always resolve against the currently configured backend URL.
client.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  return config;
});

/**
 * The backend returns rows as arrays inside `data`.
 * Convert each array row into an object using the given column order.
 * Object rows (if ever returned) are passed through untouched.
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

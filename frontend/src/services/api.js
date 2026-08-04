import axios from "axios";
import { DEFAULT_BASE_URL, STORAGE_KEYS } from "../utils/constants";

/** Reads the (user-configurable) backend URL from localStorage. */
export const getBaseUrl = () => {
  if (typeof window === "undefined") return DEFAULT_BASE_URL;
  return window.localStorage.getItem(STORAGE_KEYS.baseUrl) || DEFAULT_BASE_URL;
};

export const setBaseUrl = (url) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEYS.baseUrl, url);
  }
};

const client = axios.create({ timeout: 8000 });

// Always resolve against the currently configured backend URL.
client.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  return config;
});

/**
 * Normalizes API payloads so the UI can consume both object arrays and
 * database tuples returned by the FastAPI backend.
 */
const normalizeRecords = (payload, keys, fallback = []) => {
  const rows = Array.isArray(payload)
    ? payload
    : payload?.data || payload?.items || payload?.results || payload?.records || payload?.rows;

  if (!Array.isArray(rows)) return fallback;

  return rows.map((row) => {
    if (Array.isArray(row)) {
      return keys.reduce((acc, key, index) => {
        acc[key] = row[index];
        return acc;
      }, {});
    }

    return row && typeof row === "object" ? row : {};
  });
};

/** Central API helpers for the dashboard, products, forecast and recommendations pages. */
export const getProducts = async () => {
  const { data } = await client.get("/products");
  return normalizeRecords(data, ["id", "name", "price", "stock", "category"], []);
};

export const getForecast = async () => {
  const { data } = await client.get("/forecast");
  return normalizeRecords(data, ["date", "demand", "revenue", "predicted"], []);
};

export const getRecommendations = async () => {
  const { data } = await client.get("/recommendations");
  return normalizeRecords(
    data,
    ["id", "product", "current_price", "recommended_price", "revenue_gain", "status"],
    [],
  );
};

export default client;

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

const client = axios.create({
  timeout: 8000,
});

client.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  return config;
});

const normalizeRecords = (payload, keys, fallback = []) => {
  const rows = Array.isArray(payload)
    ? payload
    : payload?.data ||
      payload?.items ||
      payload?.results ||
      payload?.records ||
      payload?.rows;

  if (!Array.isArray(rows)) return fallback;

  return rows.map((row) => {
    if (Array.isArray(row)) {
      return keys.reduce((obj, key, index) => {
        obj[key] = row[index];
        return obj;
      }, {});
    }

    return row && typeof row === "object" ? row : {};
  });
};

// Products API
export const getProducts = async () => {
  const { data } = await client.get("/products");

  return normalizeRecords(
    data,
    [
      "id",
      "name",
      "price",
      "stock",
      "category"
    ],
    []
  );
};

// Forecast API
export const getForecast = async () => {
  const { data } = await client.get("/forecast");

  return normalizeRecords(
    data,
    [
      "id",
      "product_id",
      "forecast_date",
      "forecasted_demand",
      "lower_bound",
      "upper_bound",
      "confidence",
      "model_name",
      "created_at"
    ],
    []
  );
};

// Recommendations API
export const getRecommendations = async () => {
  const { data } = await client.get("/recommendations");

  return normalizeRecords(
    data,
    [
      "id",
      "product_id",
      "current_price",
      "recommended_price",
      "forecasted_demand",
      "competitor_price",
      "reason",
      "created_at"
    ],
    []
  );
};

export default client;
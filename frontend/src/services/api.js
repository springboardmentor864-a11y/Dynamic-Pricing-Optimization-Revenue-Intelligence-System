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

export const fetchProducts = async () => {
  const { data } = await client.get("/products");
  return data;
};

export const fetchForecast = async () => {
  const { data } = await client.get("/forecast");
  return data;
};

export const fetchRecommendations = async () => {
  const { data } = await client.get("/recommendations");
  return data;
};

export default client;

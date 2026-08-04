import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEYS, DEFAULT_REFRESH_INTERVAL } from "../utils/constants";

/**
 * Shared data-fetching hook: loads from the API and silently falls back to
 * dummy data when the FastAPI backend is unreachable.
 */
export function useApiResource(fetcher, fallback) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcherRef.current();
      setData(Array.isArray(result) || result ? result : fallback);
      setError(null);
    } catch (err) {
      // Graceful degradation — keep the UI usable with demo data.
      setError(err?.message || "Unable to reach the backend. Showing demo data.");
      setData(fallback);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    const seconds =
      Number(
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEYS.refreshInterval)
          : null,
      ) || DEFAULT_REFRESH_INTERVAL;
    if (seconds <= 0) return;
    const id = setInterval(load, seconds * 1000);
    return () => clearInterval(id);
  }, [load]);

  return { data, loading, error, refresh: load };
}

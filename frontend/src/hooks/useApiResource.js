import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEYS, DEFAULT_REFRESH_INTERVAL } from "../utils/constants";

/**
 * Shared data-fetching hook. Always returns a real array from the backend —
 * on failure it returns an empty list plus an error message (no mock data).
 */
export function useApiResource(fetcher) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcherRef.current();
      setData(Array.isArray(result) ? result : []);
      setError(null);
    } catch (err) {
      setData([]);
      setError(err?.message || "Unable to reach the backend.");
    } finally {
      setLoading(false);
    }
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

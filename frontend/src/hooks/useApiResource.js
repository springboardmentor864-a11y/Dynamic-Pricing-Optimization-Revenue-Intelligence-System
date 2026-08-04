import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEYS, DEFAULT_REFRESH_INTERVAL } from "../utils/constants";

/**
 * Shared data-fetching hook for the page-level API calls.
 * It keeps loading/error state and preserves the UI even when one endpoint fails.
 */
export function useApiResource(fetcher, fallback = []) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(Array.isArray(result) ? result : fallback);
    } catch (err) {
      setError(err?.message || "Unable to load data");
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

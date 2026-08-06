import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEYS, DEFAULT_REFRESH_INTERVAL } from "../utils/constants";

/**
 * Shared data-fetching hook. Always returns a real array from the backend.
 *
 * Fixes vs. the naive version:
 * - `loading` is only true for the *first* successful-or-failed fetch.
 *   Background polls no longer flip pages back into their skeleton state,
 *   which is what made data feel like it was "flickering" every refresh
 *   interval.
 * - A failed background poll (a dropped connection, a slow backend, etc.)
 *   keeps the last known-good `data` on screen and just surfaces `error` —
 *   it no longer wipes the table back to empty. Only a failure on the very
 *   first load (when there's nothing good to show yet) clears `data`.
 * - `fetcherRef` still avoids stale closures: `load` itself never changes
 *   identity, so the interval effect below never has to tear down and
 *   re-create its `setInterval` just because the caller passed a new
 *   function reference on re-render.
 * - Overlapping fetches are skipped (`isFetchingRef`) so a slow request
 *   can't stack with the next interval tick and race it.
 */
export function useApiResource(fetcher) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const hasLoadedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const load = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!hasLoadedRef.current) setLoading(true);

    try {
      const result = await fetcherRef.current();
      setData(Array.isArray(result) ? result : []);
      setError(null);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err?.message || "Unable to reach the backend.");
      if (!hasLoadedRef.current) setData([]);
    } finally {
      isFetchingRef.current = false;
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
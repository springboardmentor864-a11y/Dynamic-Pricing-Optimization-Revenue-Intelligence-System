import { fetchForecast } from "../services/api";
import { DUMMY_FORECAST } from "../utils/constants";
import { useApiResource } from "./useApiResource";

/** Demand forecast from GET /forecast (falls back to demo data). */
export function useForecast() {
  const { data, loading, error, refresh } = useApiResource(fetchForecast, DUMMY_FORECAST);
  const forecast = Array.isArray(data) ? data : (data?.forecast ?? DUMMY_FORECAST);
  return { forecast, loading, error, refresh };
}

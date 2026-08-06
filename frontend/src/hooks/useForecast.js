import { fetchForecast } from "../services/api";
import { useApiResource } from "./useApiResource";

/** Demand forecast from GET /forecast. */
export function useForecast() {
  const { data, loading, error, refresh } = useApiResource(fetchForecast);
  return { forecast: data, loading, error, refresh };
}

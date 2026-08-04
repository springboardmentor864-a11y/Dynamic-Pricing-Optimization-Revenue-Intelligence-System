import { getForecast } from "../services/api";
import { useApiResource } from "./useApiResource";

/** Demand forecast from GET /forecast. */
export function useForecast() {
  const { data, loading, error, refresh } = useApiResource(getForecast, []);
  const forecast = Array.isArray(data) ? data : [];
  return { forecast, loading, error, refresh };
}

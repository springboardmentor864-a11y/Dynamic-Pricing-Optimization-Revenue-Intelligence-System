import { getRecommendations } from "../services/api";
import { useApiResource } from "./useApiResource";

/** AI pricing recommendations from GET /recommendations. */
export function useRecommendations() {
  const { data, loading, error, refresh } = useApiResource(getRecommendations, []);
  const recommendations = Array.isArray(data) ? data : [];
  return { recommendations, loading, error, refresh };
}

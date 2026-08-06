import { fetchRecommendations } from "../services/api";
import { useApiResource } from "./useApiResource";

/** AI pricing recommendations from GET /recommendations. */
export function useRecommendations() {
  const { data, loading, error, refresh } = useApiResource(fetchRecommendations);
  return { recommendations: data, loading, error, refresh };
}

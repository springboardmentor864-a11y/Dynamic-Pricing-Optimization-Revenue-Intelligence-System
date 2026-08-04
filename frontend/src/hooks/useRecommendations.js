import { fetchRecommendations } from "../services/api";
import { DUMMY_RECOMMENDATIONS } from "../utils/constants";
import { useApiResource } from "./useApiResource";

/** AI pricing recommendations from GET /recommendations (falls back to demo data). */
export function useRecommendations() {
  const { data, loading, error, refresh } = useApiResource(
    fetchRecommendations,
    DUMMY_RECOMMENDATIONS,
  );
  const recommendations = Array.isArray(data)
    ? data
    : (data?.recommendations ?? DUMMY_RECOMMENDATIONS);
  return { recommendations, loading, error, refresh };
}

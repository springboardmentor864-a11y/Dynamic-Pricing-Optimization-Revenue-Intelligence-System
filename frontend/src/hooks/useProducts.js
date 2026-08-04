import { getProducts } from "../services/api";
import { useApiResource } from "./useApiResource";

/** Products list from GET /products. */
export function useProducts() {
  const { data, loading, error, refresh } = useApiResource(getProducts, []);
  const products = Array.isArray(data) ? data : [];
  return { products, loading, error, refresh };
}

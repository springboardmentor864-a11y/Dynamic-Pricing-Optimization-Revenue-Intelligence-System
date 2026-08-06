import { fetchProducts } from "../services/api";
import { useApiResource } from "./useApiResource";

/** Products list from GET /products. */
export function useProducts() {
  const { data, loading, error, refresh } = useApiResource(fetchProducts);
  return { products: data, loading, error, refresh };
}

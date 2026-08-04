import { fetchProducts } from "../services/api";
import { DUMMY_PRODUCTS } from "../utils/constants";
import { useApiResource } from "./useApiResource";

/** Products list from GET /products (falls back to demo data). */
export function useProducts() {
  const { data, loading, error, refresh } = useApiResource(fetchProducts, DUMMY_PRODUCTS);
  const products = Array.isArray(data) ? data : (data?.products ?? DUMMY_PRODUCTS);
  return { products, loading, error, refresh };
}

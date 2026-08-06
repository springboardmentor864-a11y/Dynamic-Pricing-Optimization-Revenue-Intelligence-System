import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import ProductTable from "../components/ProductTable";
import Loader from "../components/Loader";
import { useProducts } from "../hooks/useProducts";
import "../styles/Tables.css";

export default function Products() {
  const { products, loading, error } = useProducts();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))],
    [products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q ||
        String(p.name ?? "").toLowerCase().includes(q) ||
        String(p.category ?? "").toLowerCase().includes(q) ||
        String(p.id ?? "").includes(q);
      const matchesCategory = category === "all" || p.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, category]);

  return (
    <>
      <PageHeader
        title="Products"
        description="Every SKU tracked by the pricing engine."
        actions={<span className="pp-badge pp-badge-muted">{filtered.length} results</span>}
      />

      {error ? (
        <div className="mb-5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          Unable to reach the backend — check the Backend URL in Settings.
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name, category or ID"
          className="sm:max-w-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          className="pp-input sm:max-w-[12rem]"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All categories" : c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader variant="skeleton" rows={8} label="Loading products..." />
      ) : (
        <ProductTable products={filtered} />
      )}
    </>
  );
}

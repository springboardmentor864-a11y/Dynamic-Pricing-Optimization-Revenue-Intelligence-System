import { useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp, FiExternalLink } from "react-icons/fi";
import { formatCurrency, formatNumber, sortBy, stockLabel } from "../utils/helpers";

const COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Product" },
  { key: "price", label: "Price" },
  { key: "stock", label: "Stock" },
  { key: "category", label: "Category" },
];

/** Sortable products table: ID, Product, Price, Stock, Category, Action. */
export default function ProductTable({ products = [], compact = false }) {
  const [sort, setSort] = useState({ key: "id", direction: "asc" });

  const rows = useMemo(
    () => sortBy(products, sort.key, sort.direction),
    [products, sort],
  );

  const toggle = (key) =>
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );

  return (
    <div className="pp-card">
      <div className="pp-table-wrap">
        <table className="pp-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} scope="col">
                  <button type="button" onClick={() => toggle(col.key)}>
                    {col.label}
                    {sort.key === col.key ? (
                      sort.direction === "asc" ? (
                        <FiChevronUp />
                      ) : (
                        <FiChevronDown />
                      )
                    ) : null}
                  </button>
                </th>
              ))}
              {compact ? null : <th scope="col">Action</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="pp-table-empty" colSpan={compact ? 5 : 6}>
                  No products match your filters.
                </td>
              </tr>
            ) : (
              rows.map((p) => {
                const stock = stockLabel(p.stock);
                return (
                  <tr key={p.id}>
                    <td className="text-muted-foreground">#{p.id}</td>
                    <td className="font-medium text-foreground">{p.name}</td>
                    <td className="tabular-nums">{formatCurrency(p.price)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums">{formatNumber(p.stock)}</span>
                        <span className={`pp-badge pp-badge-${stock.tone}`}>{stock.label}</span>
                      </div>
                    </td>
                    <td>
                      <span className="pp-badge pp-badge-muted">{p.category}</span>
                    </td>
                    {compact ? null : (
                      <td>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          Optimize <FiExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

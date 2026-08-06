import { useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { EMPTY_TEXT } from "../utils/constants";
import {
  formatCurrency,
  formatNumber,
  safeText,
  sortBy,
  stockLabel,
} from "../utils/helpers";

const COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Product Name" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price" },
  { key: "stock", label: "Stock" },
];

/** Sortable products table */
export default function ProductTable({ products = [], limit }) {
  const [sort, setSort] = useState({ key: "id", direction: "asc" });

  const rows = useMemo(() => {
    const sorted = sortBy(products, sort.key, sort.direction);
    return limit ? sorted.slice(0, limit) : sorted;
  }, [products, sort, limit]);

  const toggle = (key) =>
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );

  return (
    <div className="pp-card pp-glass">
      <div className="pp-table-wrap">
        <table className="pp-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key}>
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
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="pp-table-empty" colSpan={5}>
                  {EMPTY_TEXT}
                </td>
              </tr>
            ) : (
              rows.map((p, i) => {
                const stock = stockLabel(p.stock);

                return (
                  <tr key={p.id ?? i}>
                    <td>#{safeText(p.id, "0")}</td>

                    <td>{safeText(p.name)}</td>

                    <td>
                      <span className="pp-badge pp-badge-muted">
                        {safeText(p.category, "Uncategorized")}
                      </span>
                    </td>

                    <td>{formatCurrency(p.price)}</td>

                    <td>
                      <div className="flex items-center gap-2">
                        <span>{formatNumber(p.stock)}</span>
                        <span className={`pp-badge pp-badge-${stock.tone}`}>
                          {stock.label}
                        </span>
                      </div>
                    </td>
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
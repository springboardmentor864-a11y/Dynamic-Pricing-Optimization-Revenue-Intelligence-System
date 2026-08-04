import { FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { formatCurrency, formatPercent, isPositive, statusTone } from "../utils/helpers";

/** AI pricing recommendations table. */
export default function RecommendationTable({ recommendations = [], limit }) {
  const rows = limit ? recommendations.slice(0, limit) : recommendations;

  return (
    <div className="pp-card">
      <div className="pp-table-wrap">
        <table className="pp-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Current Price</th>
              <th scope="col">Suggested Price</th>
              <th scope="col">Revenue Gain</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="pp-table-empty" colSpan={5}>
                  No recommendations available yet.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const up = isPositive(r.revenue_gain);
                const tone = statusTone(r.status);
                return (
                  <tr key={r.id ?? i}>
                    <td className="font-medium text-foreground">{r.product ?? r.name}</td>
                    <td className="tabular-nums">{formatCurrency(r.current_price)}</td>
                    <td className="tabular-nums font-semibold text-primary">
                      {formatCurrency(r.recommended_price ?? r.suggested_price)}
                    </td>
                    <td>
                      <span className={`pp-badge ${up ? "pp-badge-success" : "pp-badge-danger"}`}>
                        {up ? <FiTrendingUp /> : <FiTrendingDown />}
                        {formatPercent(r.revenue_gain)}
                      </span>
                    </td>
                    <td>
                      <span className={`pp-badge pp-badge-${tone} capitalize`}>
                        {r.status ?? "pending"}
                      </span>
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

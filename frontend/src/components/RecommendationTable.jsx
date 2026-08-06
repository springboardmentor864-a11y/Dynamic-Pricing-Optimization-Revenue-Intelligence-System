import { FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { EMPTY_TEXT } from "../utils/constants";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  safeNum,
  safeText,
} from "../utils/helpers";

/** AI pricing recommendations table (matches the backend row shape). */
export default function RecommendationTable({ recommendations = [], limit }) {
  const rows = limit ? recommendations.slice(0, limit) : recommendations;

  return (
    <div className="pp-card pp-glass">
      <div className="pp-table-wrap">
        <table className="pp-table">
          <thead>
            <tr>
              <th scope="col">Product ID</th>
              <th scope="col">Current Price</th>
              <th scope="col">Recommended Price</th>
              <th scope="col">Forecasted Demand</th>
              <th scope="col">Competitor Price</th>
              <th scope="col">Reason</th>
              <th scope="col">Created Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="pp-table-empty" colSpan={7}>
                  {EMPTY_TEXT}
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const current = safeNum(r.current_price);
                const recommended = safeNum(r.recommended_price);
                const up = recommended >= current;
                return (
                  <tr key={r.id ?? i}>
                    <td className="font-medium text-foreground">
                      #{safeText(r.product_id, "0")}
                    </td>
                    <td className="tabular-nums">{formatCurrency(current)}</td>
                    <td className="tabular-nums font-semibold text-primary">
                      <span className="inline-flex items-center gap-1.5">
                        {formatCurrency(recommended)}
                        <span
                          className={`pp-badge ${up ? "pp-badge-success" : "pp-badge-danger"}`}
                        >
                          {up ? <FiTrendingUp /> : <FiTrendingDown />}
                        </span>
                      </span>
                    </td>
                    <td className="tabular-nums">{formatNumber(r.forecasted_demand)}</td>
                    <td className="tabular-nums">{formatCurrency(r.competitor_price)}</td>
                    <td className="max-w-[18rem] text-muted-foreground">
                      {safeText(r.reason)}
                    </td>
                    <td className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(r.generated_at)}
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

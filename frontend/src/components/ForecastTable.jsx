import { EMPTY_TEXT } from "../utils/constants";
import { formatConfidence, formatDate, formatNumber, safeText } from "../utils/helpers";

/** Forecast table matching the backend row shape. */
export default function ForecastTable({ forecast = [], limit }) {
  const rows = limit ? forecast.slice(0, limit) : forecast;

  return (
    <div className="pp-card pp-glass">
      <div className="pp-table-wrap">
        <table className="pp-table">
          <thead>
            <tr>
              <th scope="col">Forecast Date</th>
              <th scope="col">Product ID</th>
              <th scope="col">Forecasted Demand</th>
              <th scope="col">Lower Bound</th>
              <th scope="col">Upper Bound</th>
              <th scope="col">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="pp-table-empty" colSpan={6}>
                  {EMPTY_TEXT}
                </td>
              </tr>
            ) : (
              rows.map((f, i) => (
                <tr key={f.id ?? i}>
                  <td className="whitespace-nowrap font-medium text-foreground">
                    {formatDate(f.forecast_date)}
                  </td>
                  <td className="text-muted-foreground">#{safeText(f.product_id, "0")}</td>
                  <td className="tabular-nums">{formatNumber(f.forecasted_demand)}</td>
                  <td className="tabular-nums">{formatNumber(f.lower_bound)}</td>
                  <td className="tabular-nums">{formatNumber(f.upper_bound)}</td>
                  <td>
                    <span className="pp-badge pp-badge-success">
                      {formatConfidence(f.confidence)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

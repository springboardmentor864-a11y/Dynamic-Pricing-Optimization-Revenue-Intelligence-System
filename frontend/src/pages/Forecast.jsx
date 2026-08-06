import { useMemo, useState } from "react";
import { FiActivity, FiArrowDownRight, FiArrowUpRight, FiPercent } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import SearchBar from "../components/SearchBar";
import ForecastChart from "../components/ForecastChart";
import ForecastTable from "../components/ForecastTable";
import Loader from "../components/Loader";
import { useForecast } from "../hooks/useForecast";
import {
  average,
  formatConfidence,
  formatNumber,
  formatShortDate,
  safeNum,
  sum,
} from "../utils/helpers";
import "../styles/Dashboard.css";
import "../styles/Tables.css";

export default function Forecast() {
  const { forecast, loading, error } = useForecast();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return forecast;
    return forecast.filter((f) =>
      [f.product_id, f.forecast_date, f.model_name]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q)),
    );
  }, [forecast, query]);

  const stats = useMemo(() => {
    const demands = filtered.map((f) => safeNum(f.forecasted_demand));
    return {
      total: sum(filtered, "forecasted_demand"),
      avgConfidence: average(filtered, "confidence"),
      max: demands.length ? Math.max(...demands) : 0,
      min: demands.length ? Math.min(...demands) : 0,
    };
  }, [filtered]);

  const chartData = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => new Date(a.forecast_date) - new Date(b.forecast_date))
        .map((f) => ({
          date: formatShortDate(f.forecast_date),
          demand: safeNum(f.forecasted_demand),
          lower: safeNum(f.lower_bound),
          upper: safeNum(f.upper_bound),
        })),
    [filtered],
  );

  return (
    <>
      <PageHeader
        title="Forecast"
        description="Model-predicted demand with confidence bounds per product."
        actions={<span className="pp-badge pp-badge-muted">{filtered.length} rows</span>}
      />

      {error ? (
        <div className="mb-5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          Unable to reach the backend — check the Backend URL in Settings.
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-6">
          <Loader variant="cards" rows={4} label="Loading forecast metrics..." />
          <Loader variant="skeleton" rows={6} label="Loading forecast..." />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="pp-stat-grid">
            <StatCard
              title="Total Forecasted Demand"
              value={formatNumber(stats.total)}
              icon={FiActivity}
              hint="units"
            />
            <StatCard
              title="Average Confidence"
              value={formatConfidence(stats.avgConfidence)}
              icon={FiPercent}
              hint="model confidence"
            />
            <StatCard
              title="Highest Forecasted Demand"
              value={formatNumber(stats.max)}
              icon={FiArrowUpRight}
              hint="peak units"
            />
            <StatCard
              title="Lowest Forecasted Demand"
              value={formatNumber(stats.min)}
              icon={FiArrowDownRight}
              hint="trough units"
            />
          </div>

          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by product ID, date or model"
            className="sm:max-w-sm"
          />

          <div className="pp-chart-grid">
            <ForecastChart
              title="Forecasted Demand"
              subtitle="Units per forecast date"
              data={chartData}
              series={[{ key: "demand", name: "Forecasted demand", color: "var(--chart-1)" }]}
            />
            <ForecastChart
              title="Forecast Range"
              subtitle="Lower and upper bounds"
              data={chartData}
              variant="area"
              series={[
                { key: "upper", name: "Upper bound", color: "var(--chart-2)" },
                { key: "lower", name: "Lower bound", color: "var(--chart-1)" },
              ]}
            />
          </div>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Forecast Table</h2>
            <ForecastTable forecast={filtered} />
          </section>
        </div>
      )}
    </>
  );
}

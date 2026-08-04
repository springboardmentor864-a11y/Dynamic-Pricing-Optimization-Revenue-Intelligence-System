import { useMemo } from "react";
import { FiActivity, FiCalendar, FiTarget } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ForecastChart from "../components/ForecastChart";
import Loader from "../components/Loader";
import { useForecast } from "../hooks/useForecast";
import { formatCurrency, formatNumber } from "../utils/helpers";
import "../styles/Dashboard.css";
import "../styles/Tables.css";

export default function Forecast() {
  const { forecast, loading, error } = useForecast();

  const stats = useMemo(() => {
    const total = forecast.reduce(
      (s, f) => s + Number(f.demand ?? f.actual_demand ?? 0),
      0,
    );
    const peak = forecast.reduce(
      (best, f) =>
        Number(f.demand ?? f.actual_demand ?? 0) > Number(best?.demand ?? best?.actual_demand ?? 0)
          ? f
          : best,
      forecast[0],
    );
    const accuracy =
      forecast.length > 0
        ? 1 -
          forecast.reduce((s, f) => {
            const actual = Number(f.demand ?? f.actual_demand ?? 0) || 1;
            const predicted = Number(f.predicted ?? f.forecast ?? actual);
            return s + Math.abs(actual - predicted) / actual;
          }, 0) /
            forecast.length
        : 0;
    return { total, peak, accuracy };
  }, [forecast]);

  return (
    <>
      <PageHeader
        title="Demand Forecast"
        description="Model-predicted demand, accuracy and period-by-period history."
      />

      {error ? (
        <div className="mb-5 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          Unable to load data.
        </div>
      ) : null}

      {loading ? (
        <Loader label="Loading forecast..." />
      ) : (
        <div className="space-y-6">
          <div className="pp-stat-grid">
            <StatCard
              title="Total Forecasted Demand"
              value={formatNumber(stats.total)}
              trend={0.096}
              icon={FiActivity}
              hint="units"
            />
            <StatCard
              title="Peak Period"
              value={stats.peak?.date ?? "—"}
              trend={0.147}
              icon={FiCalendar}
              hint={`${formatNumber(stats.peak?.demand)} units`}
            />
            <StatCard
              title="Model Accuracy"
              value={`${(stats.accuracy * 100).toFixed(1)}%`}
              trend={0.018}
              icon={FiTarget}
              hint="MAPE-based"
            />
            <StatCard
              title="Forecast Revenue"
              value={formatCurrency(
                forecast.reduce((s, f) => s + Number(f.revenue ?? 0), 0),
              )}
              trend={0.112}
              icon={FiTarget}
              hint="projected"
            />
          </div>

          <ForecastChart
            title="Actual vs. Predicted Demand"
            subtitle="Units per period"
            data={forecast}
            height={340}
            series={[
              { key: "demand", name: "Actual", color: "var(--chart-1)" },
              { key: "predicted", name: "Predicted", color: "var(--chart-2)", dashed: true },
            ]}
          />

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Forecast History</h2>
            <div className="pp-card">
              <div className="pp-table-wrap">
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th scope="col">Period</th>
                      <th scope="col">Actual Demand</th>
                      <th scope="col">Predicted Demand</th>
                      <th scope="col">Variance</th>
                      <th scope="col">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map((f, i) => {
                      const actual = Number(f.demand ?? f.actual_demand ?? 0);
                      const predicted = Number(f.predicted ?? f.forecast ?? actual);
                      const variance = predicted - actual;
                      return (
                        <tr key={f.date ?? i}>
                          <td className="font-medium text-foreground">{f.date}</td>
                          <td className="tabular-nums">{formatNumber(actual)}</td>
                          <td className="tabular-nums">{formatNumber(predicted)}</td>
                          <td>
                            <span
                              className={`pp-badge ${variance >= 0 ? "pp-badge-success" : "pp-badge-danger"}`}
                            >
                              {variance >= 0 ? "+" : ""}
                              {formatNumber(variance)}
                            </span>
                          </td>
                          <td className="tabular-nums">{formatCurrency(f.revenue)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

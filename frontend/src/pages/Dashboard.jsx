import { useMemo } from "react";
import {
  FiActivity,
  FiArrowDownRight,
  FiArrowUpRight,
  FiDollarSign,
  FiPackage,
  FiPercent,
  FiTarget,
} from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ForecastChart from "../components/ForecastChart";
import ProductTable from "../components/ProductTable";
import ForecastTable from "../components/ForecastTable";
import RecommendationTable from "../components/RecommendationTable";
import Loader from "../components/Loader";
import { useProducts } from "../hooks/useProducts";
import { useForecast } from "../hooks/useForecast";
import { useRecommendations } from "../hooks/useRecommendations";
import {
  average,
  formatConfidence,
  formatCurrency,
  formatNumber,
  formatShortDate,
  safeNum,
  safeText,
  sum,
} from "../utils/helpers";
import "../styles/Dashboard.css";
import "../styles/Tables.css";

export default function Dashboard() {
  const { products, loading: pLoading, error: pError } = useProducts();
  const { forecast, loading: fLoading, error: fError } = useForecast();
  const { recommendations, loading: rLoading, error: rError } = useRecommendations();

  const loading = pLoading || fLoading || rLoading;
  const error = pError || fError || rError;

  const priceById = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(String(p.id), safeNum(p.price)));
    return map;
  }, [products]);

  const stats = useMemo(() => {
    const demands = forecast.map((f) => safeNum(f.forecasted_demand));
    return {
      totalProducts: products.length,
      totalDemand: sum(forecast, "forecasted_demand"),
      avgCurrentPrice: average(recommendations, "current_price"),
      avgRecommendedPrice: average(recommendations, "recommended_price"),
      avgConfidence: average(forecast, "confidence"),
      maxDemand: demands.length ? Math.max(...demands) : 0,
      minDemand: demands.length ? Math.min(...demands) : 0,
    };
  }, [products, forecast, recommendations]);

  /** Forecast rows grouped by date for the trend / range / confidence charts. */
  const timeline = useMemo(() => {
    const buckets = new Map();
    forecast.forEach((f) => {
      const key = String(f.forecast_date ?? "");
      const entry =
        buckets.get(key) ??
        { key, date: formatShortDate(f.forecast_date), demand: 0, lower: 0, upper: 0, revenue: 0, conf: 0, n: 0 };
      const demand = safeNum(f.forecasted_demand);
      entry.demand += demand;
      entry.lower += safeNum(f.lower_bound);
      entry.upper += safeNum(f.upper_bound);
      entry.revenue += demand * (priceById.get(String(f.product_id)) ?? 0);
      entry.conf += safeNum(f.confidence);
      entry.n += 1;
      buckets.set(key, entry);
    });
    return Array.from(buckets.values())
      .sort((a, b) => new Date(a.key) - new Date(b.key))
      .map((e) => ({
        ...e,
        revenue: Number(e.revenue.toFixed(2)),
        confidence: e.n ? Number(((e.conf / e.n) * (Math.abs(e.conf / e.n) <= 1 ? 100 : 1)).toFixed(1)) : 0,
      }));
  }, [forecast, priceById]);

  const priceComparison = useMemo(
    () =>
      recommendations.slice(0, 12).map((r) => ({
        product: safeText(
          products.find((p) => String(p.id) === String(r.product_id))?.name,
          `#${safeText(r.product_id, "0")}`,
        ),
        current: safeNum(r.current_price),
        recommended: safeNum(r.recommended_price),
      })),
    [recommendations, products],
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live pricing performance, demand signals and AI optimization opportunities."
      />

      {error ? (
        <div className="mb-5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          Unable to reach the backend — check the Backend URL in Settings. ({error})
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-6">
          <Loader variant="cards" rows={4} label="Loading metrics..." />
          <Loader variant="skeleton" rows={6} label="Loading charts..." />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="pp-stat-grid">
            <StatCard
              title="Total Products"
              value={formatNumber(stats.totalProducts)}
              icon={FiPackage}
              hint="tracked SKUs"
            />
            <StatCard
              title="Total Forecasted Demand"
              value={formatNumber(stats.totalDemand)}
              icon={FiActivity}
              hint="units across all forecasts"
            />
            <StatCard
              title="Average Current Price"
              value={formatCurrency(stats.avgCurrentPrice)}
              icon={FiDollarSign}
              hint="across recommendations"
            />
            <StatCard
              title="Average Recommended Price"
              value={formatCurrency(stats.avgRecommendedPrice)}
              icon={FiTarget}
              hint="AI suggested"
            />
            <StatCard
              title="Average Confidence"
              value={formatConfidence(stats.avgConfidence)}
              icon={FiPercent}
              hint="model confidence"
            />
            <StatCard
              title="Highest Forecasted Demand"
              value={formatNumber(stats.maxDemand)}
              icon={FiArrowUpRight}
              hint="peak units"
            />
            <StatCard
              title="Lowest Forecasted Demand"
              value={formatNumber(stats.minDemand)}
              icon={FiArrowDownRight}
              hint="trough units"
            />
          </div>

          <div className="pp-chart-grid">
            <ForecastChart
              title="Revenue Trend"
              subtitle="Forecasted demand × current product price"
              data={timeline}
              variant="area"
              series={[{ key: "revenue", name: "Revenue", color: "var(--chart-1)" }]}
            />
            <ForecastChart
              title="Forecasted Demand"
              subtitle="Units per forecast date"
              data={timeline}
              series={[{ key: "demand", name: "Forecasted demand", color: "var(--chart-2)" }]}
            />
            <ForecastChart
              title="Forecast Range"
              subtitle="Lower and upper bounds"
              data={timeline}
              variant="area"
              series={[
                { key: "upper", name: "Upper bound", color: "var(--chart-2)" },
                { key: "lower", name: "Lower bound", color: "var(--chart-1)" },
              ]}
            />
            <ForecastChart
              title="Current Price vs Recommended Price"
              subtitle="Per product"
              data={priceComparison}
              xKey="product"
              variant="bar"
              series={[
                { key: "current", name: "Current price", color: "var(--chart-1)" },
                { key: "recommended", name: "Recommended price", color: "var(--chart-2)" },
              ]}
            />
          </div>

          <ForecastChart
            title="Confidence Level"
            subtitle="Average model confidence per forecast date (%)"
            data={timeline}
            variant="area"
            height={260}
            series={[{ key: "confidence", name: "Confidence %", color: "var(--chart-3, var(--chart-2))" }]}
          />

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              Latest AI Recommendations
            </h2>
            <RecommendationTable recommendations={recommendations} limit={5} />
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Upcoming Forecasts</h2>
            <ForecastTable forecast={forecast} limit={5} />
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Products</h2>
            <ProductTable products={products} limit={5} />
          </section>
        </div>
      )}
    </>
  );
}

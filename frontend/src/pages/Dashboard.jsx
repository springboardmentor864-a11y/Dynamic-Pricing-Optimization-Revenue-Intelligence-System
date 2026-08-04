import { useMemo } from "react";
import { FiActivity, FiDollarSign, FiPackage, FiTrendingUp } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ForecastChart from "../components/ForecastChart";
import ProductTable from "../components/ProductTable";
import RecommendationTable from "../components/RecommendationTable";
import Loader from "../components/Loader";
import { useProducts } from "../hooks/useProducts";
import { useForecast } from "../hooks/useForecast";
import { useRecommendations } from "../hooks/useRecommendations";
import { formatCurrency, formatNumber, sortBy } from "../utils/helpers";
import "../styles/Dashboard.css";
import "../styles/Tables.css";

export default function Dashboard() {
  const { products, loading: pLoading, error: pError } = useProducts();
  const { forecast, loading: fLoading } = useForecast();
  const { recommendations, loading: rLoading } = useRecommendations();

  const loading = pLoading || fLoading || rLoading;

  const stats = useMemo(() => {
    const revenue = forecast.reduce((sum, f) => sum + Number(f.revenue ?? 0), 0);
    const demand = forecast.reduce((sum, f) => sum + Number(f.demand ?? 0), 0);
    const avgGain =
      recommendations.length > 0
        ? recommendations.reduce((s, r) => s + Number(r.revenue_gain ?? 0), 0) /
          recommendations.length
        : 0;
    return { revenue, demand, avgGain };
  }, [forecast, recommendations]);

  const topProducts = useMemo(
    () => sortBy(products, "price", "desc").slice(0, 5),
    [products],
  );

  return (
    <>
      <PageHeader
        title="Revenue Dashboard"
        description="Live pricing performance, demand signals and AI optimization opportunities."
      />

      {pError ? (
        <div className="mb-5 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          Backend unreachable — showing demo data. {pError}
        </div>
      ) : null}

      {loading ? (
        <Loader label="Fetching revenue intelligence..." />
      ) : (
        <div className="space-y-6">
          <div className="pp-stat-grid">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.revenue)}
              trend={0.124}
              icon={FiDollarSign}
              hint="vs. last period"
            />
            <StatCard
              title="Forecasted Demand"
              value={formatNumber(stats.demand)}
              trend={0.083}
              icon={FiActivity}
              hint="units next 8 periods"
            />
            <StatCard
              title="Active Products"
              value={formatNumber(products.length)}
              trend={0.021}
              icon={FiPackage}
              hint="tracked SKUs"
            />
            <StatCard
              title="Avg. Revenue Uplift"
              value={`${(stats.avgGain * 100).toFixed(1)}%`}
              trend={stats.avgGain}
              icon={FiTrendingUp}
              hint="from AI pricing"
            />
          </div>

          <div className="pp-chart-grid">
            <ForecastChart
              title="Revenue Trend"
              subtitle="Realized revenue per period"
              data={forecast}
              variant="area"
              series={[{ key: "revenue", name: "Revenue", color: "var(--chart-1)" }]}
            />
            <ForecastChart
              title="Demand Forecast"
              subtitle="Actual vs. predicted units"
              data={forecast}
              series={[
                { key: "demand", name: "Actual demand", color: "var(--chart-1)" },
                { key: "predicted", name: "Predicted", color: "var(--chart-2)", dashed: true },
              ]}
            />
          </div>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">
              Latest AI Recommendations
            </h2>
            <RecommendationTable recommendations={recommendations} limit={5} />
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Top Products</h2>
            <ProductTable products={topProducts} compact />
          </section>
        </div>
      )}
    </>
  );
}

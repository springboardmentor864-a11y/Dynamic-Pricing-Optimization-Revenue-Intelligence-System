import { useMemo, useState } from "react";
import { FiActivity, FiDollarSign, FiTarget, FiTrendingUp } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import StatCard from "../components/StatCard";
import ForecastChart from "../components/ForecastChart";
import RecommendationTable from "../components/RecommendationTable";
import Loader from "../components/Loader";
import { useRecommendations } from "../hooks/useRecommendations";
import { useProducts } from "../hooks/useProducts";
import { average, formatCurrency, formatNumber, safeNum, safeText, sum } from "../utils/helpers";
import "../styles/Dashboard.css";
import "../styles/Tables.css";

export default function Recommendations() {
  const { recommendations, loading, error } = useRecommendations();
  const { products } = useProducts();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recommendations;
    return recommendations.filter((r) =>
      [r.product_id, r.reason]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q)),
    );
  }, [recommendations, query]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      avgCurrent: average(filtered, "current_price"),
      avgRecommended: average(filtered, "recommended_price"),
      totalDemand: sum(filtered, "forecasted_demand"),
    }),
    [filtered],
  );

  const chartData = useMemo(
    () =>
      filtered.slice(0, 12).map((r) => ({
        product: safeText(
          products.find((p) => String(p.id) === String(r.product_id))?.name,
          `#${safeText(r.product_id, "0")}`,
        ),
        current: safeNum(r.current_price),
        recommended: safeNum(r.recommended_price),
        competitor: safeNum(r.competitor_price),
      })),
    [filtered, products],
  );

  return (
    <>
      <PageHeader
        title="Recommendations"
        description="AI-suggested price moves with competitor context and demand outlook."
        actions={<span className="pp-badge pp-badge-muted">{filtered.length} rows</span>}
      />

      {error ? (
        <div className="mb-5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          Unable to reach the backend — check the Backend URL in Settings.
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-6">
          <Loader variant="cards" rows={4} label="Loading recommendation metrics..." />
          <Loader variant="skeleton" rows={6} label="Loading recommendations..." />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="pp-stat-grid">
            <StatCard
              title="Total Recommendations"
              value={formatNumber(stats.total)}
              icon={FiTrendingUp}
              hint="this cycle"
            />
            <StatCard
              title="Average Current Price"
              value={formatCurrency(stats.avgCurrent)}
              icon={FiDollarSign}
              hint="live pricing"
            />
            <StatCard
              title="Average Recommended Price"
              value={formatCurrency(stats.avgRecommended)}
              icon={FiTarget}
              hint="AI suggested"
            />
            <StatCard
              title="Total Forecasted Demand"
              value={formatNumber(stats.totalDemand)}
              icon={FiActivity}
              hint="units"
            />
          </div>

          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by product ID or reason"
            className="sm:max-w-sm"
          />

          <ForecastChart
            title="Current Price vs Recommended Price"
            subtitle="Compared against competitor pricing"
            data={chartData}
            xKey="product"
            variant="bar"
            height={320}
            series={[
              { key: "current", name: "Current", color: "var(--chart-1)" },
              { key: "recommended", name: "Recommended", color: "var(--chart-2)" },
              { key: "competitor", name: "Competitor", color: "var(--chart-3, var(--muted-foreground))" },
            ]}
          />

          <RecommendationTable recommendations={filtered} />
        </div>
      )}
    </>
  );
}

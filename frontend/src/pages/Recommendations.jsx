import { useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiTrendingUp } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import StatCard from "../components/StatCard";
import RecommendationTable from "../components/RecommendationTable";
import Loader from "../components/Loader";
import { useRecommendations } from "../hooks/useRecommendations";
import { formatPercent } from "../utils/helpers";
import "../styles/Dashboard.css";
import "../styles/Tables.css";

const STATUSES = ["all", "pending", "approved", "rejected"];

export default function Recommendations() {
  const { recommendations, loading, error } = useRecommendations();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recommendations.filter((r) => {
      const name = String(r.product ?? r.name ?? "").toLowerCase();
      const matchesQuery = !q || name.includes(q);
      const matchesStatus =
        status === "all" || String(r.status ?? "pending").toLowerCase() === status;
      return matchesQuery && matchesStatus;
    });
  }, [recommendations, query, status]);

  const stats = useMemo(() => {
    const approved = recommendations.filter(
      (r) => String(r.status ?? "").toLowerCase() === "approved",
    ).length;
    const pending = recommendations.filter(
      (r) => String(r.status ?? "pending").toLowerCase() === "pending",
    ).length;
    const avgGain =
      recommendations.length > 0
        ? recommendations.reduce((s, r) => s + Number(r.revenue_gain ?? 0), 0) /
          recommendations.length
        : 0;
    return { approved, pending, avgGain };
  }, [recommendations]);

  return (
    <>
      <PageHeader
        title="Pricing Recommendations"
        description="AI-suggested price moves ranked by expected revenue impact."
      />

      {error ? (
        <div className="mb-5 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          Unable to load data.
        </div>
      ) : null}

      {loading ? (
        <Loader label="Loading recommendations..." />
      ) : (
        <div className="space-y-6">
          <div className="pp-stat-grid">
            <StatCard
              title="Open Recommendations"
              value={stats.pending}
              trend={0.05}
              icon={FiClock}
              hint="awaiting review"
            />
            <StatCard
              title="Approved"
              value={stats.approved}
              trend={0.09}
              icon={FiCheckCircle}
              hint="live in pricing"
            />
            <StatCard
              title="Avg. Expected Gain"
              value={formatPercent(stats.avgGain)}
              trend={stats.avgGain}
              icon={FiTrendingUp}
              hint="per recommendation"
            />
            <StatCard
              title="Total Suggestions"
              value={recommendations.length}
              trend={0.032}
              icon={FiTrendingUp}
              hint="this cycle"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search recommendations"
              className="sm:max-w-sm"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
              className="pp-input sm:max-w-[12rem]"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s}
                </option>
              ))}
            </select>
          </div>

          <RecommendationTable recommendations={filtered} />
        </div>
      )}
    </>
  );
}

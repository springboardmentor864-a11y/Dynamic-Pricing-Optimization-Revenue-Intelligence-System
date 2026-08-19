import { useMemo } from "react";
import { useData } from "../context/DataContext";
import {
  Users,
  TrendingDown,
  TrendingUp,
  Globe,
  Award,
} from "lucide-react";

export default function CompetitorAnalysis() {
  const { products } = useData();

  // Filter products that have competitor price records
  const competitorProducts = useMemo(() => {
    return products.filter((p) => Number(p.competitorPrice || 0) > 0);
  }, [products]);

  const stats = useMemo(() => {
    const total = competitorProducts.length;
    const lower = competitorProducts.filter((p) => Number(p.competitorPrice) < Number(p.price)).length;
    const higher = competitorProducts.filter((p) => Number(p.competitorPrice) > Number(p.price)).length;

    // Simple dynamic calculation for market share based on relative pricing competitiveness
    const averageCompetitiveness = total > 0
      ? (competitorProducts.filter((p) => Number(p.price) <= Number(p.competitorPrice)).length / total) * 100
      : 75;

    return [
      {
        title: "Tracked Competitors",
        value: total.toString(),
        icon: Users,
        color: "bg-blue-500",
      },
      {
        title: "Competitors Priced Lower",
        value: lower.toString(),
        icon: TrendingDown,
        color: "bg-red-500",
      },
      {
        title: "Competitors Priced Higher",
        value: higher.toString(),
        icon: TrendingUp,
        color: "bg-green-500",
      },
      {
        title: "Pricing Competitiveness",
        value: `${Math.round(averageCompetitiveness)}%`,
        icon: Globe,
        color: "bg-purple-500",
      },
    ];
  }, [competitorProducts]);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Award className="text-blue-600" size={36} />
          Competitor Analysis
        </h1>
        <p className="text-slate-500 text-lg mt-2">
          Real-time price monitoring and positioning against market competitor listings.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 flex items-center justify-between hover:shadow-lg transition duration-200"
            >
              <div>
                <p className="text-slate-500 font-medium text-sm">{item.title}</p>
                <h2 className="text-3xl font-extrabold text-slate-800 mt-2">{item.value}</h2>
              </div>
              <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center text-white shadow-sm`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Comparison Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Competitor Price Discrepancies</h2>
            <p className="text-slate-500 text-sm mt-1">
              Direct comparison of store prices against indexed competitor values.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="text-left p-5">Product</th>
                <th className="text-left py-4 pl-4">Manufacturer Brand</th>
                <th className="text-center py-4">Our Price</th>
                <th className="text-center py-4">Competitor Price</th>
                <th className="text-center py-4">Trend Position</th>
                <th className="text-left py-4 pl-6">Pricing Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {competitorProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 font-medium">
                    No competitor pricing data found. Please upload a dataset containing competitorPrice records.
                  </td>
                </tr>
              ) : (
                competitorProducts.map((item, idx) => {
                  const ourPrice = Number(item.price || 0);
                  const compPrice = Number(item.competitorPrice || 0);
                  const diff = compPrice - ourPrice;

                  let trend = "Equal";
                  let trendClass = "bg-blue-100 text-blue-700";
                  let recommendation = "Maintain Price";

                  if (diff > 0) {
                    trend = "We are cheaper";
                    trendClass = "bg-green-100 text-green-700";
                    recommendation = "Pricing headroom: Consider slight increase";
                  } else if (diff < 0) {
                    trend = "Competitor is cheaper";
                    trendClass = "bg-red-100 text-red-700";
                    recommendation = "Undercut: Consider lowering price";
                  }

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/30 transition">
                      <td className="p-5 font-semibold text-slate-800 max-w-[220px] truncate">
                        {item.product}
                      </td>
                      <td className="py-4 text-slate-500 pl-4">{item.brand || "Unknown Brand"}</td>
                      <td className="text-center py-4 font-bold text-slate-700">₹{ourPrice.toLocaleString()}</td>
                      <td className="text-center py-4 font-bold text-slate-700">₹{compPrice.toLocaleString()}</td>
                      <td className="text-center py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${trendClass}`}>
                          {trend}
                        </span>
                      </td>
                      <td className="py-4 text-slate-600 font-medium pl-6 text-xs">{recommendation}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
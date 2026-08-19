import { useMemo } from "react";
import { Brain, TrendingUp, AlertTriangle } from "lucide-react";
import { useData } from "../context/DataContext";

export default function AIInsights() {
  const { products, isDataLoaded } = useData();

  const insights = useMemo(() => {
    if (!products || products.length === 0) return null;

    const validProducts = products.filter(p => p && (p.product || p.name));
    if (validProducts.length === 0) return null;

    const highestRevenue = [...validProducts].sort(
      (a, b) => Number(b.revenue || 0) - Number(a.revenue || 0)
    )[0];

    const highestSales = [...validProducts].sort(
      (a, b) => Number(b.sales || 0) - Number(a.sales || 0)
    )[0];

    const lowestStock = [...validProducts].sort(
      (a, b) => Number(a.stock || 0) - Number(b.stock || 0)
    )[0];

    const expensiveProduct = [...validProducts].sort(
      (a, b) => Number(b.price || 0) - Number(a.price || 0)
    )[0];

    return {
      highestRevenue,
      highestSales,
      lowestStock,
      expensiveProduct,
    };
  }, [products]);

  if (!isDataLoaded || !insights || !insights.highestRevenue) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg p-8">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">AI Insights</h2>
        <p className="text-slate-600 dark:text-slate-300 mt-4 text-base font-medium">
          Upload a CSV/Excel dataset to generate AI insights.
        </p>
      </div>
    );
  }

  const topRevProd = insights.highestRevenue.product || insights.highestRevenue.name || "Top Product";
  const topSalesProd = insights.highestSales.product || insights.highestSales.name || "Best Seller";
  const lowStockProd = insights.lowestStock.product || insights.lowestStock.name || "Item";
  const expProd = insights.expensiveProduct.product || insights.expensiveProduct.name || "Premium Product";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/80 flex items-center justify-center flex-shrink-0">
          <Brain className="text-purple-600 dark:text-purple-300" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">AI Insights</h2>
          <p className="text-slate-600 dark:text-slate-300 text-base font-medium">
            Intelligent analysis from your uploaded dataset
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 p-6 border border-emerald-200 dark:border-emerald-700/60 shadow-sm">
          <div className="flex items-start gap-4">
            <TrendingUp className="text-emerald-700 dark:text-emerald-300 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-emerald-950 dark:text-emerald-200 text-lg">Highest Revenue Product</h3>
              <p className="text-slate-800 dark:text-slate-200 mt-1 text-base font-medium">
                <strong className="text-emerald-900 dark:text-white">{topRevProd}</strong> generated ₹
                {Number(insights.highestRevenue.revenue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/70 p-6 border border-blue-200 dark:border-blue-700/60 shadow-sm">
          <div className="flex items-start gap-4">
            <TrendingUp className="text-blue-700 dark:text-blue-300 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-blue-950 dark:text-blue-200 text-lg">Highest Sales Volume</h3>
              <p className="text-slate-800 dark:text-slate-200 mt-1 text-base font-medium">
                <strong className="text-blue-900 dark:text-white">{topSalesProd}</strong> sold {insights.highestSales.sales || 0} units
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-red-50 dark:bg-red-950/70 p-6 border border-red-200 dark:border-red-700/60 shadow-sm">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-red-700 dark:text-red-300 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-red-950 dark:text-red-200 text-lg">Low Stock Alert</h3>
              <p className="text-slate-800 dark:text-slate-200 mt-1 text-base font-medium">
                <strong className="text-red-900 dark:text-white">{lowStockProd}</strong> has only {insights.lowestStock.stock || 0} items remaining.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/70 p-6 border border-amber-200 dark:border-amber-700/60 shadow-sm">
          <div className="flex items-start gap-4">
            <Brain className="text-amber-700 dark:text-amber-300 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-amber-950 dark:text-amber-200 text-lg">AI Pricing Recommendation</h3>
              <p className="text-slate-800 dark:text-slate-200 mt-1 text-base font-medium">
                Increase inventory for <strong className="text-amber-900 dark:text-white">{topSalesProd}</strong> and review pricing strategy for <strong className="text-amber-900 dark:text-white">{expProd}</strong> to maximize margin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
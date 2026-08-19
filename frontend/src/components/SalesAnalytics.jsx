import {
  ArrowUp,
  ArrowDown,
  Target,
  TrendingUp,
} from "lucide-react";

export default function SalesAnalytics() {
  return (
    <div className="bg-white rounded-3xl shadow-lg border p-6 h-full">

      <h2 className="text-2xl font-bold">
        Sales Analytics
      </h2>

      <p className="text-gray-500 mt-1">
        AI Business Performance
      </p>

      <div className="space-y-6 mt-8">

        <div className="flex justify-between items-center">

          <div>

            <p className="text-gray-500">
              Revenue Growth
            </p>

            <h3 className="text-3xl font-bold">
              +18.4%
            </h3>

          </div>

          <div className="bg-green-100 p-4 rounded-2xl">

            <TrendingUp
              className="text-green-600"
              size={28}
            />

          </div>

        </div>

        <div className="flex justify-between">

          <div className="flex items-center gap-3">

            <ArrowUp
              className="text-green-600"
            />

            <span>Best Seller</span>

          </div>

          <strong>iPhone 16 Pro</strong>

        </div>

        <div className="flex justify-between">

          <div className="flex items-center gap-3">

            <ArrowDown
              className="text-red-500"
            />

            <span>Lowest Demand</span>

          </div>

          <strong>AirPods Pro</strong>

        </div>

        <div className="flex justify-between">

          <div className="flex items-center gap-3">

            <Target
              className="text-blue-600"
            />

            <span>AI Accuracy</span>

          </div>

          <strong>96%</strong>

        </div>

      </div>

    </div>
  );
}
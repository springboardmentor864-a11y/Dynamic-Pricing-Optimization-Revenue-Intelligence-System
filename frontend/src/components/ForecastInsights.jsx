import { Brain } from "lucide-react";

export default function ForecastInsights() {
  return (
    <div className="bg-white rounded-3xl shadow border p-6">
      <div className="flex items-center gap-3 mb-5">
        <Brain className="text-blue-600" />
        <h2 className="text-2xl font-bold">
          AI Insights
        </h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-xl">
          📈 Smartphone demand expected to increase by 18%.
        </div>

        <div className="p-4 bg-blue-50 rounded-xl">
          💻 Laptop sales likely to remain stable.
        </div>

        <div className="p-4 bg-orange-50 rounded-xl">
          🎧 Accessories demand may decrease by 8%.
        </div>

        <div className="p-4 bg-purple-50 rounded-xl">
          🤖 Weekend sales predicted to grow by 12%.
        </div>
      </div>
    </div>
  );
}
import {
  TrendingUp,
  Package,
  Brain,
  DollarSign,
} from "lucide-react";

const cards = [
  {
    title: "Forecast Revenue",
    value: "$186,450",
    icon: DollarSign,
    color: "bg-blue-500",
  },
  {
    title: "Expected Growth",
    value: "+18%",
    icon: TrendingUp,
    color: "bg-green-500",
  },
  {
    title: "Products Forecast",
    value: "248",
    icon: Package,
    color: "bg-purple-500",
  },
  {
    title: "AI Accuracy",
    value: "97%",
    icon: Brain,
    color: "bg-orange-500",
  },
];

export default function ForecastCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="bg-white rounded-2xl shadow border p-6 hover:shadow-lg transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">{item.title}</p>

                <h2 className="text-4xl font-bold mt-3">
                  {item.value}
                </h2>
              </div>

              <div
                className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center text-white`}
              >
                <Icon size={28} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", demand: 1200 },
  { month: "Feb", demand: 1450 },
  { month: "Mar", demand: 1800 },
  { month: "Apr", demand: 2100 },
  { month: "May", demand: 2500 },
  { month: "Jun", demand: 2900 },
];

export default function DemandChart() {
  return (
    <div className="bg-white rounded-3xl shadow border p-6">
      <h2 className="text-2xl font-bold mb-5">
        Demand Forecast
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Area
            type="monotone"
            dataKey="demand"
            stroke="#2563eb"
            fill="#93c5fd"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
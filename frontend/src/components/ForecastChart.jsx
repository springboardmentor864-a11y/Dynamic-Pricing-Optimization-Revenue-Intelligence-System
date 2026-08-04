import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axisProps = {
  stroke: "var(--muted-foreground)",
  tickLine: false,
  axisLine: false,
  fontSize: 12,
};

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "0.8rem",
  color: "var(--card-foreground)",
};

/**
 * Line/area chart used for both the revenue trend and the demand forecast.
 * `series` is a list of { key, name, color } definitions.
 */
export default function ForecastChart({
  title,
  subtitle,
  data = [],
  xKey = "date",
  series = [],
  variant = "line",
  height = 300,
}) {
  const Chart = variant === "area" ? AreaChart : LineChart;

  return (
    <section className="pp-card p-5">
      {title ? (
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      ) : null}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} width={64} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
            <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            {series.map((s) =>
              variant === "area" ? (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#grad-${s.key})`}
                />
              ) : (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray={s.dashed ? "5 4" : undefined}
                />
              ),
            )}
          </Chart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

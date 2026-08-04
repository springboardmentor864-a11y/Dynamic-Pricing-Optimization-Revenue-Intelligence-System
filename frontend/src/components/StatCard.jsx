import { FiArrowDownRight, FiArrowUpRight } from "react-icons/fi";
import { formatPercent, isPositive } from "../utils/helpers";

/** KPI card: title, value, trend percentage and an icon. */
export default function StatCard({ title, value, trend, icon: Icon, hint }) {
  const up = isPositive(trend);

  return (
    <div className="pp-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {trend !== undefined && trend !== null ? (
          <span
            className={`pp-badge ${up ? "pp-badge-success" : "pp-badge-danger"}`}
          >
            {up ? <FiArrowUpRight /> : <FiArrowDownRight />}
            {formatPercent(trend)}
          </span>
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}

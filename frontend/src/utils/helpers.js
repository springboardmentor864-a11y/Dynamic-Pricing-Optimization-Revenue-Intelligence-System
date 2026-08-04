// Small formatting / data helpers shared across pages.

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

export const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value ?? 0));

/** Accepts either a ratio (0.08) or a percent number (8) and renders "+8.0%". */
export const formatPercent = (value) => {
  const n = Number(value ?? 0);
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
};

export const isPositive = (value) => Number(value ?? 0) >= 0;

/** Generic sorter used by the sortable tables. */
export const sortBy = (rows, key, direction = "asc") => {
  const dir = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a?.[key];
    const bv = b?.[key];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
  });
};

export const stockLabel = (stock) => {
  const n = Number(stock ?? 0);
  if (n === 0) return { label: "Out of stock", tone: "danger" };
  if (n < 25) return { label: "Low stock", tone: "warning" };
  return { label: "In stock", tone: "success" };
};

export const statusTone = (status) => {
  const s = String(status ?? "").toLowerCase();
  if (s === "approved" || s === "applied") return "success";
  if (s === "rejected" || s === "declined") return "danger";
  return "warning";
};

// Small formatting / data helpers shared across pages.
import { EMPTY_TEXT } from "./constants";

/** Always returns a finite number — never NaN/undefined/null. */
export const safeNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** Returns a non-empty display string — never "undefined"/"null". */
export const safeText = (value, fallback = EMPTY_TEXT) => {
  if (value === null || value === undefined) return fallback;
  const s = String(value).trim();
  return s.length > 0 && s !== "undefined" && s !== "null" ? s : fallback;
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(safeNum(value));

export const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(safeNum(value));

/** Accepts either a ratio (0.08) or a percent number (8) and renders "+8.0%". */
export const formatPercent = (value) => {
  const n = safeNum(value);
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
};

/** Confidence (0–1 or 0–100) rendered as "92.0%". */
export const formatConfidence = (value) => {
  const n = safeNum(value);
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct.toFixed(1)}%`;
};

export const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (value) => {
  const d = toDate(value);
  if (!d) return safeText(value, "—");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const formatShortDate = (value) => {
  const d = toDate(value);
  if (!d) return safeText(value, "—");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const formatDateTime = (value) => {
  const d = toDate(value);
  if (!d) return safeText(value, "—");
  return `${formatDate(value)}, ${d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export const average = (rows, key) => {
  const values = rows.map((r) => safeNum(r?.[key])).filter(() => rows.length > 0);
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
};

export const sum = (rows, key) => rows.reduce((s, r) => s + safeNum(r?.[key]), 0);

export const isPositive = (value) => safeNum(value) >= 0;

/** Generic sorter used by the sortable tables. */
export const sortBy = (rows, key, direction = "asc") => {
  const dir = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a?.[key];
    const bv = b?.[key];
    const an = Number(av);
    const bn = Number(bv);
    if (Number.isFinite(an) && Number.isFinite(bn)) return (an - bn) * dir;
    return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
  });
};

export const stockLabel = (stock) => {
  const n = safeNum(stock);
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

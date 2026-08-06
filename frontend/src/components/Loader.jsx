/** Loading indicators: spinner + skeleton blocks. */
export default function Loader({ label = "Loading data...", variant = "spinner", rows = 5 }) {
  if (variant === "skeleton") {
    return (
      <div className="pp-card p-5" aria-busy="true" aria-live="polite">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="pp-skeleton h-9 w-full" />
          ))}
        </div>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className="pp-stat-grid" aria-busy="true" aria-live="polite">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="pp-card p-5">
            <div className="pp-skeleton mb-3 h-4 w-24" />
            <div className="pp-skeleton h-8 w-32" />
          </div>
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 py-12">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

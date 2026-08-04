/** Full-panel loading spinner. */
export default function Loader({ label = "Loading data..." }) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 py-12">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

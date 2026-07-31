export default function RootLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded-md bg-muted/70" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/5] animate-pulse rounded-2xl border border-border/40 bg-muted/50"
          />
        ))}
      </div>
    </div>
  );
}

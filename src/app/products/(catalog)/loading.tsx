export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading products">
      <div className="mx-auto h-9 w-72 animate-pulse rounded-lg bg-slate-200" />
      <div className="mx-auto mt-6 h-14 max-w-2xl animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </main>
  );
}

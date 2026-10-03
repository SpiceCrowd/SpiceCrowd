export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading product">
      <div className="h-8 w-40 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="h-[28rem] animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    </main>
  );
}

export default function Newsletter() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] bg-slate-900 px-6 py-7 text-white shadow-2xl shadow-slate-900/20 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--brand-gold)]">Newsletter</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-[2rem]">Get recipes, offers and new spice alerts</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input type="email" placeholder="Your email" className="w-full rounded-full border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/30" />
            <button className="rounded-full bg-[color:var(--brand-gold)] px-5 py-3 text-sm font-semibold text-[color:var(--brand-deep-green)] transition hover:bg-[color:var(--brand-gold)]/88">Join</button>
          </div>
        </div>
      </div>
    </section>
  );
}

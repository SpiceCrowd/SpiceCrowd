export default function CustomerReelsCarousel() {
  // No genuine customer-submitted photos or videos exist in the current data model,
  // so this section intentionally shows an honest empty state instead of fabricated
  // or stock placeholder media presented as real customer content.
  return (
    <section className="reveal mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Customer reels">
      <div className="text-center">
        <p className="eyebrow">Customer moments</p>
        <h2 className="section-heading mt-3">Real Spice Crowd experiences</h2>
      </div>
      <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-dashed border-[color:var(--brand-gold)]/60 bg-[color:var(--brand-cream)] p-8 text-center">
        <p className="text-sm leading-6 text-slate-700">
          Customer reels and photos will appear here as soon as customers share genuine Spice Crowd moments.
          We only ever display real, customer-submitted media &mdash; never invented or stock placeholder content.
        </p>
      </div>
    </section>
  );
}

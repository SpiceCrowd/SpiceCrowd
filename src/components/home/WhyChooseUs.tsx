export default function WhyChooseUs() {
  const reasons = [
    { label: "No added colours", description: "Pure spice powders with no synthetic additives." },
    { label: "No artificial flavours", description: "Only genuine aroma from natural ingredients." },
    { label: "No preservatives", description: "Freshly ground and packed for quality." },
    { label: "No fillers or starch", description: "Pure spice content in every packet." },
    { label: "No adulteration", description: "Carefully sourced from trusted local farmers." },
    { label: "No chemical processing", description: "Processed with clean traditional methods." },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-16 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">From Our Kitchen</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Recipes crafted with our spices</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            We founded Spice Crowd to bring authentic, farm-fresh ingredients to every kitchen. Great cooking starts with great spices.
          </p>
          <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
            <h3 className="text-xl font-semibold text-slate-900">Track Your Order</h3>
            <p className="mt-3 text-sm text-slate-600">Enter your order ID to check delivery status.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input type="text" placeholder="Enter order ID (e.g., SC-123456)" className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/35" />
              <button className="brand-btn px-6 py-3">Track</button>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {reasons.map((reason) => (
            <div key={reason.label} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
              <h4 className="text-base font-semibold text-slate-900">{reason.label}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

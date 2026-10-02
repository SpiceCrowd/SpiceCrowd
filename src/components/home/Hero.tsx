import Image from "next/image";

export default function Hero() {
  return (
    <section className="reveal relative overflow-hidden bg-[color:var(--brand-deep-green)] px-4 py-0 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-[1440px]">
        <div className="grid min-h-[420px] items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="relative z-10 py-10 text-white lg:py-14">
            <div className="eyebrow mb-6 inline-block rounded-full border border-[color:var(--brand-gold)]/35 px-3 py-1">
              Spice Crowd
            </div>
            <h1 className="max-w-[520px] text-[3rem] leading-[0.98] text-white sm:text-[4.8rem]">
              Pure Spices
              <span className="mt-2 block">Straight from</span>
              <span className="mt-2 block text-[color:var(--brand-gold)]">Indian Farms</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/75">
              Authentic. Natural. Full of flavor.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <a href="/shop" className="inline-flex items-center rounded-xl bg-[color:var(--brand-gold)] px-5 py-3 text-sm font-bold text-[color:var(--brand-deep-green)] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#c59a58]">
                Shop Now →
              </a>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-2 gap-x-4 gap-y-3 text-sm text-[color:var(--brand-gold)]/90 sm:grid-cols-4">
              <div className="flex items-center gap-2"><span>✓</span><span>100% Natural</span></div>
              <div className="flex items-center gap-2"><span>✓</span><span>Directly Sourced</span></div>
              <div className="flex items-center gap-2"><span>✓</span><span>No Preservatives</span></div>
              <div className="flex items-center gap-2"><span>✓</span><span>Pan India Delivery</span></div>
            </div>
          </div>

          <div className="relative h-[280px] overflow-hidden rounded-tl-[4rem] rounded-br-[4rem] border border-white/15 bg-black/20 sm:h-[340px] lg:h-[420px]">
            <Image src="/images/hero.svg" alt="A curated selection of Indian spices" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover opacity-90 transition duration-700 hover:scale-105" />
            <div className="absolute inset-0 bg-[color:var(--brand-deep-green)]/15" />
          </div>
        </div>
      </div>
    </section>
  );
}

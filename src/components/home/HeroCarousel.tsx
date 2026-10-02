"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  { eyebrow: "Kolli Hills origin", title: "From the hills to your home", body: "Explore the landscape and careful sourcing behind every Spice Crowd kitchen essential.", image: "/images/hero.svg", cta: "Explore our story", href: "/#about-us" },
  { eyebrow: "Indian spice collection", title: "A richer everyday pantry", body: "Discover pepper, turmeric, cinnamon, cardamom, coffee, and more from regional Indian origins.", image: "/images/kolli-hills-black-pepper.svg", cta: "Shop all spices", href: "/products" },
  { eyebrow: "Coffee and warm flavours", title: "Make room for aroma", body: "Bring roasted beans and coffee powders into the same considered pantry as your spices.", image: "/images/roasted-coffee-beans.svg", cta: "Explore coffee", href: "/products?q=coffee" },
  { eyebrow: "Curated gifting", title: "More flavour to explore", body: "Build a thoughtful spice shelf with combo packs and everyday favourites for the people you cook for.", image: "/images/cardamom.svg", cta: "Discover combo packs", href: "/#gift-packs" },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused]);
  const slide = slides[active];
  return <section className="relative overflow-hidden bg-[color:var(--brand-deep-green)] text-white" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
    <div className="mx-auto grid min-h-[520px] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-14">
      <div className="relative z-10 max-w-xl reveal" key={slide.title}>
        <p className="eyebrow">{slide.eyebrow}</p>
        <h1 className="mt-4 text-5xl leading-[1.02] sm:text-6xl">{slide.title}</h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-white/75">{slide.body}</p>
        <Link href={slide.href} className="mt-8 inline-flex rounded-xl bg-[color:var(--brand-gold)] px-5 py-3 text-sm font-bold text-[color:var(--brand-deep-green)] shadow-lg transition hover:-translate-y-0.5">{slide.cta} <span aria-hidden="true" className="ml-2">→</span></Link>
      </div>
      <div className="relative h-[300px] overflow-hidden rounded-tl-[4rem] rounded-br-[4rem] border border-white/15 bg-black/20 sm:h-[380px] lg:h-[440px]" key={slide.image}>
        <Image src={slide.image} alt="" fill priority={active === 0} sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover transition duration-700" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[color:var(--brand-deep-green)]/60 via-transparent to-[color:var(--brand-gold)]/20" />
      </div>
    </div>
    <div className="absolute bottom-6 left-4 right-4 mx-auto flex max-w-7xl items-center justify-between sm:left-6 sm:right-6 lg:left-8 lg:right-8">
      <div className="flex gap-2" role="tablist" aria-label="Homepage feature slides">{slides.map((item, index) => <button key={item.title} type="button" role="tab" aria-selected={active === index} aria-label={`Show slide ${index + 1}`} onClick={() => setActive(index)} className={`h-2 rounded-full transition-all ${active === index ? "w-8 bg-[color:var(--brand-gold)]" : "w-2 bg-white/45"}`} />)}</div>
      <div className="flex gap-2"><button type="button" aria-label="Previous slide" onClick={() => setActive((active - 1 + slides.length) % slides.length)} className="h-9 w-9 rounded-full border border-white/30 text-lg transition hover:bg-white/10">‹</button><button type="button" aria-label="Next slide" onClick={() => setActive((active + 1) % slides.length)} className="h-9 w-9 rounded-full border border-white/30 text-lg transition hover:bg-white/10">›</button></div>
    </div>
  </section>;
}

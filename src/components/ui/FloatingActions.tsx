"use client";

export default function FloatingActions() {
  const openSpicey = () => {
    window.dispatchEvent(new Event("open-spicey-assistant"));
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
      <button type="button" onClick={openSpicey} className="inline-flex items-center rounded-full bg-[color:var(--brand-deep-green)] px-5 py-3 text-sm font-semibold text-[color:var(--brand-gold)] shadow-xl shadow-black/20 transition hover:bg-[color:var(--brand-maroon-700)]">
        Ask Spicy
      </button>
      <a href="https://wa.me/916374334813?text=Hello%20Spice%20Crowd%2C%20I%20need%20help" target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-[color:var(--brand-gold)]/40 bg-[color:var(--brand-gold)] px-5 py-3 text-sm font-semibold text-[color:var(--brand-deep-green)] shadow-xl shadow-black/20 transition hover:bg-[color:var(--brand-gold)]/85">
        Chat with us
      </a>
    </div>
  );
}

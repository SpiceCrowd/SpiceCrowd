export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[color:var(--brand-deep-green)] shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <h1 className="text-3xl font-bold text-white">
          🌶️ SpiceCrowd
        </h1>

        <nav className="hidden gap-8 text-white font-medium md:flex">
          <a href="#" className="transition hover:text-[color:var(--brand-gold)]">
            Home
          </a>
          <a href="#" className="transition hover:text-[color:var(--brand-gold)]">
            Shop
          </a>
          <a href="#" className="transition hover:text-[color:var(--brand-gold)]">
            Categories
          </a>
          <a href="#" className="transition hover:text-[color:var(--brand-gold)]">
            About
          </a>
          <a href="#" className="transition hover:text-[color:var(--brand-gold)]">
            Contact
          </a>
        </nav>

        <button className="rounded-lg bg-[color:var(--brand-gold)] px-5 py-2 text-[color:var(--brand-deep-green)] hover:bg-[color:var(--brand-gold)]/88">
          Shop Now
        </button>
      </div>
    </header>
  );
}
import Link from "next/link";
import { site } from "@/config/site";

export default function Footer() {
  const links = {
    quickLinks: [
      { label: "Home", href: "/" },
      { label: "All Spices", href: "/products" },
      { label: "Combo Packs", href: "/#gift-packs" },
      { label: "Recipes", href: "/support#recipes" },
      { label: "Loyalty Points", href: "/support#loyalty-points" },
      { label: "Refer and Earn", href: "/support#refer-and-earn" },
      { label: "Our Story", href: "/#about-us" },
    ],
    support: [
      { label: "Shipping", href: "/support#shipping" },
      { label: "Returns", href: "/support#returns" },
      { label: "Let Us Help You", href: "/support#help" },
      { label: "Contact Us", href: "/support#contact-us" },
      { label: "FAQ", href: "/support#faq" },
    ],
    info: [
      { label: "Return and Exchanges", href: "/support#return-and-exchanges" },
      { label: "Terms", href: "/support#terms" },
      { label: "Privacy Policy", href: "/support#privacy-policy" },
      { label: "GST Updates", href: "/support#gst-updates" },
    ],
    connect: [
      { label: "Instagram", href: "https://instagram.com", external: true },
      { label: "Facebook", href: "https://facebook.com", external: true },
      { label: "WhatsApp", href: "https://wa.me/919000000000", external: true },
      { label: "Email Us", href: "mailto:support@spicecrowd@gmail.com", external: true },
    ],
  };

  return (
    <footer className="bg-[color:var(--brand-deep-green)] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-2xl font-semibold text-[color:var(--brand-gold)]">Spice Crowd</p>
            <p className="mt-4 text-sm leading-7 text-[color:var(--brand-gold)]/85">From the Kolli Hills of Tamil Nadu to kitchens across India.</p>
            <div className="mt-4 space-y-2 text-sm text-[color:var(--brand-gold)]/85">
              <a href={site.mapUrl} target="_blank" rel="noreferrer" className="block hover:text-[color:var(--brand-gold)]">{site.address.line1}, {site.address.city}, {site.address.state} {site.address.postcode}</a>
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="block hover:text-[color:var(--brand-gold)]">{site.phone}</a>
              <a href={site.website} target="_blank" rel="noreferrer" className="block hover:text-[color:var(--brand-gold)]">www.spicecrowd.shop</a>
            </div>
            <div className="mt-8">
              <p className="text-sm uppercase tracking-[0.35em] text-[color:var(--brand-gold)]/70">Accepted Payments</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase text-[color:var(--brand-gold)]/95">
                <span className="rounded-full bg-[color:var(--brand-maroon-700)] px-3 py-2">Visa</span>
                <span className="rounded-full bg-[color:var(--brand-maroon-700)] px-3 py-2">MC</span>
                <span className="rounded-full bg-[color:var(--brand-maroon-700)] px-3 py-2">UPI</span>
                <span className="rounded-full bg-[color:var(--brand-maroon-700)] px-3 py-2">GPay</span>
                <span className="rounded-full bg-[color:var(--brand-maroon-700)] px-3 py-2">PhonePe</span>
                <span className="rounded-full bg-[color:var(--brand-maroon-700)] px-3 py-2">COD</span>
              </div>
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:col-span-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--brand-gold)]/70">Quick Links</p>
              <ul className="mt-5 space-y-3 text-sm text-[color:var(--brand-gold)]/88">
                {links.quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition hover:text-[color:var(--brand-gold)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--brand-gold)]/70">Support</p>
              <ul className="mt-5 space-y-3 text-sm text-[color:var(--brand-gold)]/88">
                {links.support.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition hover:text-[color:var(--brand-gold)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--brand-gold)]/70">Important Info</p>
              <ul className="mt-5 space-y-3 text-sm text-[color:var(--brand-gold)]/88">
                {links.info.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition hover:text-[color:var(--brand-gold)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--brand-gold)]/70">Connect</p>
              <ul className="mt-5 space-y-3 text-sm text-[color:var(--brand-gold)]/88">
                {links.connect.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}
                      className="transition hover:text-[color:var(--brand-gold)]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-14 border-t border-[color:var(--brand-gold)]/30 pt-8 text-center text-xs text-[color:var(--brand-gold)]/72">
          2024 Spice Crowd. All rights reserved. | GSTIN: 33FFIPS5308F1ZE | FSSAI: 12426998000062
        </div>
      </div>
    </footer>
  );
}

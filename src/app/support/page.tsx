import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import { site } from "@/config/site";
import FaqAccordion from "@/components/support/FaqAccordion";

const faqItems = [
  { question: "How do I check an order?", answer: "Sign in to view your orders, or use the order tracking page with the order details available to you. Tracking status is shown when a tracking record has been assigned." },
  { question: "What should I do if an order arrives damaged or incorrect?", answer: "Keep the packaging and order details, then submit a return or refund request from the Returns page. The support team can review the request and confirm the next step." },
  { question: "Which payment methods are available?", answer: "The checkout currently presents card, UPI, netbanking, and wallet options in demo payment mode. Availability and final payment processing depend on the configured payment provider." },
  { question: "Can I change my delivery address after ordering?", answer: "Address changes are not presented as a self-service workflow in the current website. Contact Spice Crowd promptly with your order ID so the team can confirm whether the order can still be updated." },
  { question: "Are loyalty points and referrals active?", answer: "The current website does not expose a live points balance or referral redemption workflow. Reward amounts, eligibility, and launch timing require business confirmation." },
];

const sections = [
  ["shipping", "Shipping and delivery"],
  ["returns", "Returns and refunds"],
  ["help", "Let us help you"],
  ["contact-us", "Contact Spice Crowd"],
  ["faq", "Frequently asked questions"],
  ["terms", "Terms and conditions"],
  ["privacy-policy", "Privacy information"],
  ["gst-updates", "GST and invoices"],
  ["recipes", "Recipes"],
  ["loyalty-points", "Loyalty points"],
  ["refer-and-earn", "Refer and earn"],
];

function InfoSection({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-32 rounded-2xl border border-[color:var(--brand-line)] bg-white p-6 shadow-sm sm:p-8">
    <p className="eyebrow">{eyebrow}</p><h2 className="mt-2 text-3xl text-slate-950">{title}</h2><div className="mt-5 text-sm leading-7 text-slate-600">{children}</div>
  </section>;
}

export default function SupportPage() {
  return <><Header /><main className="brand-page-bg py-10 sm:py-14"><div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
    <section className="reveal overflow-hidden rounded-3xl bg-[color:var(--brand-deep-green)] p-7 text-white shadow-xl sm:p-10">
      <p className="eyebrow">Customer care</p><h1 className="mt-3 max-w-3xl text-5xl leading-tight sm:text-6xl">A clearer way to get help.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-white/75">Find order guidance, delivery information, returns help, contact details, and the current status of Spice Crowd services.</p>
      <div className="mt-7 flex flex-wrap gap-3"><Link href="/products" className="brand-btn bg-[color:var(--brand-gold)] text-[color:var(--brand-deep-green)]">Shop spices</Link><Link href="/account/orders" className="inline-flex items-center rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">View my orders</Link></div>
    </section>

    <nav aria-label="Help topics" className="mt-6 flex gap-2 overflow-x-auto pb-2">{sections.slice(0, 5).map(([id, label]) => <a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-[color:var(--brand-line)] bg-white px-4 py-2 text-xs font-semibold text-[color:var(--brand-deep-green)] transition hover:border-[color:var(--brand-gold)]">{label}</a>)}</nav>

    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <InfoSection id="shipping" eyebrow="01 / Delivery" title="Shipping and delivery"><p>The checkout currently offers standard and express choices. The displayed charge and estimate are shown at checkout and may depend on stock, destination, and serviceability.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[color:var(--brand-cream)] p-4"><strong className="text-slate-900">1. Order</strong><p className="mt-1">Review your address, items, and delivery choice.</p></div><div className="rounded-xl bg-[color:var(--brand-cream)] p-4"><strong className="text-slate-900">2. Prepare</strong><p className="mt-1">Your order moves through confirmation and packing.</p></div><div className="rounded-xl bg-[color:var(--brand-cream)] p-4"><strong className="text-slate-900">3. Track</strong><p className="mt-1">Use your order page when tracking is assigned.</p></div></div><p className="mt-5 rounded-xl border border-dashed border-[color:var(--brand-gold)]/60 bg-[color:var(--brand-cream)] p-4 text-sm">Delivery cut-offs, serviceable pincodes, carrier commitments, and final shipping charges require business confirmation before being published as guarantees.</p></InfoSection>
        <InfoSection id="returns" eyebrow="02 / After purchase" title="Returns, refunds, and cancellations"><p>For a damaged, incorrect, or unsatisfactory order, submit a request with the order ID, order email, reason, and details. Requests are reviewed by the support team before a refund or other resolution is confirmed.</p><ol className="mt-5 grid gap-3 sm:grid-cols-3"><li className="rounded-xl border border-[color:var(--brand-line)] p-4"><strong className="text-slate-900">01. Tell us</strong><p className="mt-1">Describe the issue and keep order evidence available.</p></li><li className="rounded-xl border border-[color:var(--brand-line)] p-4"><strong className="text-slate-900">02. Review</strong><p className="mt-1">The team checks the order and request details.</p></li><li className="rounded-xl border border-[color:var(--brand-line)] p-4"><strong className="text-slate-900">03. Resolve</strong><p className="mt-1">The approved outcome and refund status are shared through the account workflow.</p></li></ol><p className="mt-5 rounded-xl border border-dashed border-[color:var(--brand-gold)]/60 bg-[color:var(--brand-cream)] p-4">Return windows, consumable-goods eligibility, cancellation cut-offs, replacement rules, and refund timelines require business/legal confirmation.</p><Link href="/returns" className="brand-btn mt-5">Open returns form</Link></InfoSection>
        <InfoSection id="help" eyebrow="03 / Support" title="Let us help you"><p>Start with your account orders and tracking page for order-specific information. For questions that are not covered there, contact Spice Crowd with your order ID when relevant.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><Link href="/account/orders" className="surface-lift rounded-xl border border-[color:var(--brand-line)] p-4"><strong className="text-slate-900">Orders</strong><p className="mt-1">Track confirmed orders and delivery status.</p></Link><a href={`mailto:support@spicecrowd.in`} className="surface-lift rounded-xl border border-[color:var(--brand-line)] p-4"><strong className="text-slate-900">Email</strong><p className="mt-1">support@spicecrowd.in</p></a><a href={`tel:${site.phone.replace(/\s/g, "")}`} className="surface-lift rounded-xl border border-[color:var(--brand-line)] p-4"><strong className="text-slate-900">Phone</strong><p className="mt-1">{site.phone}</p></a></div></InfoSection>
        <InfoSection id="contact-us" eyebrow="04 / Contact" title="Contact Spice Crowd"><p>Spice Crowd is based at {site.address.line1}, {site.address.city}, {site.address.state} {site.address.postcode}.</p><div className="mt-5 flex flex-wrap gap-3"><a href={`tel:${site.phone.replace(/\s/g, "")}`} className="brand-btn">Call {site.phone}</a><a href="mailto:support@spicecrowd.in" className="brand-btn-outline">Email support</a><a href="https://wa.me/916374334813?text=Hello%20Spice%20Crowd%2C%20I%20need%20help" target="_blank" rel="noreferrer" className="brand-btn-outline">WhatsApp</a></div><p className="mt-5 text-xs text-slate-500">The website currently provides contact links rather than a dedicated contact form. No submission-success claim is made here.</p></InfoSection>
        <InfoSection id="faq" eyebrow="05 / Answers" title="Frequently asked questions"><FaqAccordion items={faqItems} /></InfoSection>
        <InfoSection id="terms" eyebrow="06 / Legal" title="Terms and conditions"><p>Use the website responsibly, provide accurate delivery information, and review your cart before placing an order. Product availability, prices, delivery choices, and order acceptance are subject to the information shown at checkout.</p><p className="mt-4">The current project does not contain a verified legal terms document. This summary is not a substitute for legal terms; business and legal review is required before publishing a complete policy.</p></InfoSection>
        <InfoSection id="privacy-policy" eyebrow="07 / Privacy" title="Privacy information"><p>The application processes account, delivery, order, payment-reference, and support information to operate the store. Access to account and order information is protected by authentication checks in the application.</p><p className="mt-4">Retention periods, cookie disclosures, third-party sharing, data-subject rights, and formal security commitments require business and legal confirmation before being stated as policy.</p></InfoSection>
        <InfoSection id="gst-updates" eyebrow="08 / India tax information" title="GST and invoices"><p>GST and invoice details are calculated and displayed as part of the checkout and order flows where supported. Customers who need a GST invoice should provide their GSTIN during checkout when the field is available.</p><p className="mt-4">Tax rates, classifications, and regulatory updates must be verified against current business configuration and official guidance. This page does not publish a new rate or legal claim.</p></InfoSection>
        <InfoSection id="recipes" eyebrow="09 / Kitchen notes" title="Recipes and pairing ideas"><p>Recipe and pairing content is available through product detail pages and the support experience. Explore a product to see its usage notes, pairings, and related combinations.</p><Link href="/products" className="brand-btn mt-5">Explore products</Link></InfoSection>
        <InfoSection id="loyalty-points" eyebrow="10 / Coming later" title="Loyalty points"><p>A live points balance, earning ledger, and redemption workflow are not currently exposed in the application. Reward amounts, eligibility, expiry, and launch timing require confirmation.</p></InfoSection>
        <InfoSection id="refer-and-earn" eyebrow="11 / Coming later" title="Refer and earn"><p>A live referral dashboard and reward redemption workflow are not currently exposed in the application. Referral benefits and eligibility require confirmation before publication.</p></InfoSection>
      </div>
      <aside className="hidden lg:block"><div className="sticky top-28 rounded-2xl border border-[color:var(--brand-line)] bg-white p-5 shadow-sm"><p className="eyebrow">On this page</p><nav className="mt-4 space-y-2">{sections.map(([id, label]) => <a key={id} href={`#${id}`} className="block rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-[color:var(--brand-cream)] hover:text-[color:var(--brand-deep-green)]">{label}</a>)}</nav></div></aside>
    </div>
  </div></main><Footer /></>;
}

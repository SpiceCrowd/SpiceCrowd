"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "sending" | "done" | "error"; message?: string }>({ kind: "idle" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState({ kind: "sending" });
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) return setState({ kind: "error", message: data.error || "Could not subscribe. Please try again." });
      setEmail("");
      setState({ kind: "done", message: "You're subscribed. Thank you!" });
    } catch {
      setState({ kind: "error", message: "Could not subscribe. Please try again." });
    }
  }

  return (
    <section aria-labelledby="newsletter-heading" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-[color:var(--brand-deep-green)] px-6 py-8 text-white sm:px-10">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <h2 id="newsletter-heading" className="text-2xl font-bold sm:text-3xl">Stay in the loop</h2>
            <p className="mt-2 text-sm text-white/75">New products and offers from Spice Crowd, by email.</p>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row" noValidate>
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input id="newsletter-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email" className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder:text-white/55 outline-none focus:border-[color:var(--brand-gold)]" />
            <button type="submit" disabled={state.kind === "sending"} className="rounded-xl bg-[color:var(--brand-gold)] px-6 py-3 text-sm font-bold text-[color:var(--brand-deep-green)] transition hover:brightness-110 disabled:opacity-60">{state.kind === "sending" ? "Joining…" : "Subscribe"}</button>
          </form>
        </div>
        <p role="status" className={`mt-3 text-sm ${state.kind === "error" ? "text-red-200" : "text-[color:var(--brand-gold)]"}`}>{state.message}</p>
      </div>
    </section>
  );
}

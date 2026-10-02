"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

export default function ReturnsPage() {
  const [orderId, setOrderId] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("orderId") || "");
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const user = JSON.parse(window.localStorage.getItem("sc_user") || "null");
      return typeof user?.email === "string" ? user.email : "";
    } catch {
      return "";
    }
  });
  const [reason, setReason] = useState("damaged");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const response = await fetch("/api/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, email, reason, details }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setError(data.error || "Unable to submit return request");
      return;
    }
    setMessage(`Request ${data.request.id} submitted. We will review it shortly.`);
    setOrderId("");
    setDetails("");
  }

  return (
    <>
      <Header />
      <main className="brand-page-bg mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="form-shell p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-deep-green)]">Customer care</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">Returns and refunds</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Submit a request for a damaged, incorrect, or unsatisfactory order.</p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <input required value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Order ID" className="form-input" />
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Order email" className="form-input" />
            <select value={reason} onChange={(event) => setReason(event.target.value)} className="form-input">
              <option value="damaged">Product arrived damaged</option>
              <option value="incorrect">Incorrect product received</option>
              <option value="quality">Quality concern</option>
              <option value="other">Other</option>
            </select>
            <textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Tell us what happened" rows={5} className="form-input" />
            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
            <button type="submit" className="brand-btn">Submit request</button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

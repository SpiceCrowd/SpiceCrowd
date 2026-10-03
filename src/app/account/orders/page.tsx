"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import { trackingStatusLabels, type TrackingStatus } from "@/lib/tracking";

type Order = { id: string; items: any[]; total: number; status: string; createdAt: string; tracking?: { courier?: string; trackingNumber?: string; status?: string } };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('sc_token') : null;
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['authorization'] = `Bearer ${token}`;
      try {
        const res = await fetch('/api/orders', { headers });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(res.status === 401 ? "Sign in to view your orders." : "Orders are temporarily unavailable.");
          setOrders([]);
          return;
        }
        setOrders(Array.isArray(json.orders) ? json.orders : []);
      } catch {
        setError("Orders are temporarily unavailable.");
        setOrders([]);
      }
    })();
  }, []);

  return (
    <>
      <Header />
      <main className="brand-page-bg mx-auto max-w-4xl p-8">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <div className="mt-6 space-y-4">
          {error && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{error} {error.startsWith("Sign in") && <a className="font-semibold underline" href="/account/login">Sign in</a>}</div>}
          {!error && orders.length === 0 && <div>No orders yet.</div>}
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-[color:var(--brand-gold)]/45 bg-white p-4 shadow-sm">
              <div className="flex justify-between">
                <a className="font-medium text-[color:var(--brand-maroon)]" href={`/account/track/${o.id}`}>{o.id}</a>
                <div className="text-sm text-slate-600">{o.status}</div>
              </div>
              <div className="mt-2 text-sm text-slate-600">{new Date(o.createdAt).toLocaleString()}</div>
              <div className="mt-3">Total: ₹{o.total}</div>
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <p className="font-semibold">{o.tracking?.courier || "Dummy courier"} · {o.tracking?.trackingNumber || "Tracking will be assigned"}</p>
                <p className="mt-1">{trackingStatusLabels[(o.tracking?.status || "order_confirmed") as TrackingStatus]}</p>
              </div>
              <a className="brand-btn mt-3 inline-flex px-4 py-2 text-sm" href={`/account/track/${o.id}#tracking`}>Track order</a>
              <a className="mt-3 inline-block text-sm font-semibold text-[color:var(--brand-deep-green)]" href={`/returns?orderId=${encodeURIComponent(o.id)}`}>Request return or refund</a>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

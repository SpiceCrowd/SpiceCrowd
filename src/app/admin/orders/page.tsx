"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { TrackingStatus } from "@/lib/tracking";

type Order = { id: string; items?: Array<{ quantity?: number }>; total?: number; status?: string; createdAt?: string; payment?: { method?: string }; customer?: { name?: string }; tracking?: { status?: TrackingStatus; trackingNumber?: string } };
const filters = ["All", "Processing", "Shipped", "Delivered"] as const;

function orderStage(order: Order) {
  const status = order.tracking?.status;
  if (status === "delivered_or_collected") return "Delivered";
  if (["dispatched", "in_transit", "local_hub", "out_for_delivery_or_collection"].includes(status || "")) return "Shipped";
  return "Processing";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("sc_token");
    Promise.all([
      fetch("/api/orders", { headers: token ? { authorization: `Bearer ${token}` } : {} }).then((response) => response.json()),
      fetch("/api/products").then((response) => response.json()),
    ]).then(([ordersData, productsData]) => {
      setOrders(ordersData.orders || []);
      setProductsCount(Array.isArray(productsData.products) ? productsData.products.length : 0);
    }).catch(() => { setOrders([]); setProductsCount(0); }).finally(() => setLoading(false));
  }, []);

  const filteredOrders = useMemo(() => filter === "All" ? orders : orders.filter((order) => orderStage(order) === filter), [filter, orders]);
  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pending = orders.filter((order) => orderStage(order) === "Processing").length;

  async function shipOrder(order: Order) {
    const token = localStorage.getItem("sc_token");
    const response = await fetch(`/api/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ status: "dispatched" }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(data.error || "Unable to update shipment"); return; }
    setOrders((current) => current.map((item) => item.id === order.id ? data.order : item));
    setMessage(`${order.id} marked as shipped`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_color-mix(in_srgb,var(--brand-gold)_18%,white),_transparent_30%),linear-gradient(180deg,_#fff,_#f8fafc)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--brand-deep-green)]">Admin Panel</p><h1 className="mt-2 text-3xl font-black text-slate-950">Spice Crowd</h1></div><Link href="/" className="text-sm font-semibold text-slate-600 hover:text-[color:var(--brand-deep-green)]">Back to Store</Link></header>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SummaryCard icon="📦" value={String(orders.length)} label="Total Orders" /><SummaryCard icon="💰" value={`₹${revenue}`} label="Revenue" /><SummaryCard icon="🛩" value={String(productsCount)} label="Products" /><SummaryCard icon="🚚" value={String(pending)} label="Pending" /></section>
        <nav className="mt-8 flex gap-2 overflow-x-auto border-b border-slate-200 pb-2 text-sm font-semibold text-slate-600"><span className="rounded-lg bg-[color:var(--brand-maroon)] px-5 py-3 text-white">Orders</span><Link href="/admin/inventory" className="rounded-lg px-5 py-3 hover:bg-slate-100">Inventory</Link><Link href="/admin/reports" className="rounded-lg px-5 py-3 hover:bg-slate-100">Analytics</Link><Link href="/admin/tools/b2b-enquiries" className="rounded-lg px-5 py-3 hover:bg-slate-100">B2B Enquiries</Link></nav>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-xl font-bold text-slate-950">Orders</h2><div className="flex gap-2 overflow-x-auto">{filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === item ? "bg-[color:var(--brand-gold)] text-slate-950" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{item}</button>)}</div></div>{loading ? <p className="p-6 text-sm text-slate-500">Loading orders...</p> : filteredOrders.length === 0 ? <p className="p-6 text-sm text-slate-500">No orders found yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-100 text-xs uppercase tracking-[0.16em] text-slate-500"><tr><th className="px-5 py-4">Order ID</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Items</th><th className="px-5 py-4">Total</th><th className="px-5 py-4">Payment</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Actions</th></tr></thead><tbody>{filteredOrders.map((order) => { const stage = orderStage(order); const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0); return <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50"><td className="px-5 py-4 font-semibold text-[color:var(--brand-deep-green)]">{order.id.replace(/^ORDER_/, "SC-")}</td><td className="px-5 py-4">{order.customer?.name || "Guest"}</td><td className="px-5 py-4">{itemCount}</td><td className="px-5 py-4 font-semibold">₹{Number(order.total || 0)}</td><td className="px-5 py-4 uppercase text-slate-600">{order.payment?.method || "Dummy"}</td><td className="px-5 py-4 text-slate-600">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "-"}</td><td className="px-5 py-4"><span className="rounded-full bg-[color:var(--brand-gold)]/20 px-3 py-1 text-xs font-semibold text-amber-800">{stage}</span></td><td className="px-5 py-4"><div className="flex gap-2"><Link href={`/account/track/${order.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold">View</Link>{stage === "Processing" && <button type="button" onClick={() => void shipOrder(order)} className="rounded-lg bg-[color:var(--brand-deep-green)] px-3 py-1.5 text-xs font-semibold text-white">Ship</button>}</div></td></tr>; })}</tbody></table></div>}</section>
        {message && <p className="fixed bottom-5 right-5 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">{message}</p>}
      </div>
    </main>
  );
}

function SummaryCard({ icon, value, label }: { icon: string; value: string; label: string }) { return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="text-2xl">{icon}</span><div><p className="text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-sm text-slate-500">{label}</p></div></div>; }

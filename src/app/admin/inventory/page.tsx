"use client";

import { useEffect, useState } from 'react';

type Line = { slug: string; quantity: number; cost: number; expiry?: string | null };

export default function InventoryPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplier, setSupplier] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [slug, setSlug] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [cost, setCost] = useState<number>(0);
  const [expiry, setExpiry] = useState<string>('');
  const [purchases, setPurchases] = useState<any[]>([]);

  function adminHeaders(): HeadersInit {
    const token = localStorage.getItem('sc_token');
    return token ? { authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => { fetchSuppliers(); fetchPurchases(); }, []);

  async function fetchSuppliers() {
    const res = await fetch('/api/admin/inventory/suppliers', { headers: adminHeaders() });
    const data = await res.json();
    setSuppliers(data?.suppliers || []);
    setSupplier(data?.suppliers?.[0]?.id || '');
  }

  async function fetchPurchases() {
    const res = await fetch('/api/admin/inventory/purchases', { headers: adminHeaders() });
    const data = await res.json();
    setPurchases(data?.purchases || []);
  }

  function addLine() {
    if (!slug) return alert('Enter product slug');
    setLines((l) => [...l, { slug, quantity: qty, cost, expiry: expiry || null }]);
    setSlug(''); setQty(1); setCost(0);
  }

  async function submitPurchase() {
    if (!supplier) return alert('Select supplier');
    if (lines.length === 0) return alert('Add at least one line');
    const res = await fetch('/api/admin/inventory/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json', ...adminHeaders() }, body: JSON.stringify({ supplier, items: lines }) });
    const data = await res.json();
    if (data?.success) { setLines([]); fetchPurchases(); alert('Purchase recorded'); } else alert(data?.error || 'Failed');
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Inventory — Purchases</h1>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="col-span-1 space-y-2">
          <label className="block">Supplier</label>
          <select value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full rounded border px-2 py-1">
            <option value="">-- select --</option>
            {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>

          <div className="mt-2">
            <label className="block">Product slug / SKU</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded border px-2 py-1" />
            <div className="flex gap-2 mt-2">
              <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-1/3 rounded border px-2 py-1" />
              <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="w-1/3 rounded border px-2 py-1" placeholder="cost per unit" />
              <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="flex-1 rounded border px-2 py-1" />
            </div>
            <div className="mt-2">
              <button onClick={addLine} className="rounded bg-[color:var(--brand-deep-green)] px-3 py-1 text-[color:var(--brand-gold)]">Add line</button>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-medium">Current lines</h3>
            <div className="space-y-2 mt-2">
              {lines.map((ln, i) => (
                <div key={i} className="flex items-center justify-between rounded border p-2">
                    <div>{ln.slug} × {ln.quantity} @ ₹{ln.cost} {ln.expiry ? `• exp ${ln.expiry}` : ''}</div>
                  <div className="flex gap-2">
                    <button onClick={() => setLines(lines.filter((_, idx) => idx !== i))} className="text-[color:var(--brand-deep-green)]">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <button onClick={submitPurchase} className="rounded bg-[color:var(--brand-deep-green)] px-3 py-1 text-[color:var(--brand-gold)]">Record Purchase</button>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <h3 className="font-medium">Recent Purchases</h3>
          <div className="mt-3 space-y-2">
            {purchases.length === 0 && <div className="text-sm text-slate-500">No purchases yet</div>}
            {purchases.map((p) => (
              <div key={p.id} className="rounded border p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.supplier || 'Unknown'}</div>
                    <div className="text-sm text-slate-500">{new Date(p.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="font-semibold">₹{p.total}</div>
                </div>
                <div className="mt-2">
                  {p.items.map((it: any, idx: number) => (<div key={idx} className="text-sm">{it.slug} × {it.quantity} @ ₹{it.cost}</div>))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

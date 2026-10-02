"use client";

import { useEffect, useState } from 'react';

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchBatches(); }, []);

  async function fetchBatches() {
    const token = localStorage.getItem('sc_token');
    const res = await fetch('/api/admin/inventory/batches', { headers: token ? { authorization: `Bearer ${token}` } : {} });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Unable to load batches');
      return;
    }
    setBatches(data?.batches || []);
  }

  function daysUntil(expiry: string | null) {
    if (!expiry) return null;
    const diff = new Date(expiry).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  async function markConsumed(id: string) {
    const b = batches.find((x) => x.id === id);
    if (!b) return;
    setError(null);
    const remaining = Math.max(0, (b.remaining || 0) - 1);
    const token = localStorage.getItem('sc_token');
    const res = await fetch('/api/admin/inventory/batches', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ id, remaining }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Unable to update batch');
      return;
    }
    fetchBatches();
  }

  async function adjustBatch(id: string, delta: number, reason?: string) {
    const b = batches.find((x) => x.id === id);
    if (!b) return;
    setError(null);
    const token = localStorage.getItem('sc_token');
    const res = await fetch('/api/admin/inventory/batches/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ id, delta, reason }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Unable to adjust batch');
      return;
    }
    fetchBatches();
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Inventory — Batches</h1>
      {error && <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="mt-4 space-y-3">
        {batches.length === 0 && <div className="text-sm text-slate-500">No batches recorded</div>}
        {batches.map((b) => {
          const days = daysUntil(b.expiry);
          const near = days !== null && days <= 30;
          return (
            <div key={b.id} className={`rounded border p-3 ${near ? 'border-[color:var(--brand-gold)]/50 bg-[color:var(--brand-gold)]/14' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{b.product}</div>
                  <div className="text-sm text-slate-500">Batch: {b.id} • Qty: {b.quantity} • Remaining: {b.remaining}</div>
                </div>
                <div className="text-sm text-slate-400">{b.expiry ? `${days}d left` : 'No expiry'}</div>
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => markConsumed(b.id)} className="rounded border px-3 py-1">Mark -1</button>
                  <input id={`adj_${b.id}`} placeholder="+/- qty" className="w-20 rounded border px-2 py-1 text-sm" />
                  <input id={`reason_${b.id}`} placeholder="reason (optional)" className="w-48 rounded border px-2 py-1 text-sm" />
                  <button onClick={() => {
                    const v = (document.getElementById(`adj_${b.id}`) as HTMLInputElement).value;
                    const r = (document.getElementById(`reason_${b.id}`) as HTMLInputElement).value;
                    const delta = Number(v || 0);
                    if (!delta) return;
                    adjustBatch(b.id, delta, r || undefined);
                  }} className="rounded bg-[color:var(--brand-deep-green)] px-3 py-1 text-[color:var(--brand-gold)]">Apply</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

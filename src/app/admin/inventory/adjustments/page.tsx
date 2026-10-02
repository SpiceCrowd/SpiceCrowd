"use client";

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/home/Footer';

export default function AdjustmentsPage() {
  const [logs, setLogs] = useState<any[] | null>(null);
  const [batchFilter, setBatchFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function fetchLogs() {
    const token = localStorage.getItem('sc_token');
    const res = await fetch('/api/admin/inventory/batches/adjustments', { headers: token ? { authorization: `Bearer ${token}` } : {} });
    const json = await res.json();
    setLogs(json.logs || []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchLogs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (logs === null) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-6xl p-6">
          <h1 className="text-2xl font-bold">Batch Adjustments Audit</h1>
          <p className="text-sm text-slate-600 mt-2">Loading adjustments…</p>
        </main>
        <Footer />
      </>
    );
  }

  const filtered = logs.filter((l) => {
    if (batchFilter && String(l.batchId || '').indexOf(batchFilter) === -1) return false;
    if (fromDate && new Date(l.at) < new Date(fromDate)) return false;
    if (toDate && new Date(l.at) > new Date(toDate)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-bold">Batch Adjustments Audit</h1>
        <p className="text-sm text-slate-600 mt-2">Recent manual adjustments to batch remaining quantities.</p>

        <div className="mt-4 flex gap-3 items-center">
          <input placeholder="Filter batch id" value={batchFilter} onChange={(e) => { setBatchFilter(e.target.value); setPage(1); }} className="rounded border px-3 py-2" />
          <label className="text-sm">From</label>
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="rounded border px-3 py-2" />
          <label className="text-sm">To</label>
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="rounded border px-3 py-2" />
          <label className="text-sm">Page size</label>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded border px-2 py-1">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </div>

        <div className="mt-6 space-y-3">
          {pageItems.length === 0 && <div className="text-sm text-slate-500">No adjustments match your filters.</div>}
          {pageItems.map((l) => (
            <div key={l.id} className="rounded border p-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{l.batchId} • {l.id}</div>
                  <div className="text-sm text-slate-600">{l.reason || '—'}</div>
                </div>
                <div className="text-sm">{new Date(l.at).toLocaleString()}</div>
              </div>
              <div className="mt-2 text-sm">Delta: {l.delta} — Before: {l.before} — After: {l.after}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border px-3 py-1">Prev</button>
          <div className="text-sm">Page {page} / {totalPages}</div>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded border px-3 py-1">Next</button>
        </div>
      </main>
      <Footer />
    </>
  );
}

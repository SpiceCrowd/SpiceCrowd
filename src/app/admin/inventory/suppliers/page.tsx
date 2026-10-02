"use client";

import { useEffect, useState } from 'react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  function adminHeaders(): HeadersInit {
    const token = localStorage.getItem('sc_token');
    return token ? { authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => { fetchSuppliers(); }, []);

  async function fetchSuppliers() {
    const res = await fetch('/api/admin/inventory/suppliers', { headers: adminHeaders() });
    const data = await res.json();
    setSuppliers(data?.suppliers || []);
  }

  async function createSupplier() {
    if (!name) return alert('Name required');
    const res = await fetch('/api/admin/inventory/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json', ...adminHeaders() }, body: JSON.stringify({ name, contact }) });
    const data = await res.json();
    if (data?.success) {
      setName(''); setContact(''); fetchSuppliers();
    } else alert(data?.error || 'Failed');
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Inventory — Suppliers</h1>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <div className="space-y-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Supplier name" className="w-full rounded border px-2 py-1" />
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact / phone" className="w-full rounded border px-2 py-1" />
            <button onClick={createSupplier} className="rounded bg-[color:var(--brand-deep-green)] px-3 py-1 text-[color:var(--brand-gold)]">Create</button>
          </div>
        </div>
        <div className="col-span-2">
          <h2 className="font-medium">Suppliers</h2>
          <div className="mt-3 space-y-2">
            {suppliers.length === 0 && <div className="text-sm text-slate-500">No suppliers yet</div>}
            {suppliers.map((s) => (
              <div key={s.id} className="rounded border p-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-slate-500">{s.contact}</div>
                </div>
                <div className="text-sm text-slate-400">{new Date(s.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

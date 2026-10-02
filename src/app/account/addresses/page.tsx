"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

type Address = { id: string; label: string; address: string };

function getInitialAddresses(): Address[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem('sc_addresses');
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Address[];
  } catch {
    return [];
  }
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(getInitialAddresses);
  const [label, setLabel] = useState("");
  const [addr, setAddr] = useState("");

  const save = () => {
    const a = { id: `addr_${Date.now()}`, label, address: addr };
    const next = [a, ...addresses];
    setAddresses(next);
    localStorage.setItem('sc_addresses', JSON.stringify(next));
    setLabel(''); setAddr('');
  };

  const remove = (id: string) => {
    const next = addresses.filter((x) => x.id !== id);
    setAddresses(next);
    localStorage.setItem('sc_addresses', JSON.stringify(next));
  };

  return (
    <>
      <Header />
      <main className="brand-page-bg mx-auto max-w-4xl p-8">
        <h1 className="text-2xl font-bold">Addresses</h1>
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-[color:var(--brand-gold)]/45 bg-white p-4 shadow-sm">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (Home, Office)" className="brand-focus w-full rounded border px-3 py-2" />
            <textarea value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Full address" className="brand-focus w-full mt-3 rounded border px-3 py-2" />
            <div className="mt-3">
              <button type="button" onClick={save} className="brand-btn px-4 py-2">Save address</button>
            </div>
          </div>

          <div className="space-y-3">
            {addresses.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-[color:var(--brand-gold)]/35 bg-white p-3">
                <div>
                  <div className="font-medium">{a.label}</div>
                  <div className="text-sm text-slate-600">{a.address}</div>
                </div>
                <div>
                  <button type="button" onClick={() => remove(a.id)} className="brand-btn px-3 py-1">Remove</button>
                </div>
              </div>
            ))}
            {addresses.length === 0 && <div className="text-sm text-slate-600">No saved addresses.</div>}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

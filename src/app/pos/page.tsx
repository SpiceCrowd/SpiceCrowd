"use client";

import { useState } from 'react';
import { getProducts, type Product } from '@/lib/products';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { readHeldBills, addHeldBill, removeHeldBill } from '@/lib/posStorage';
import { downloadReceiptPdf } from '@/lib/receiptPdf';
import Header from '@/components/layout/Header';
import Footer from '@/components/home/Footer';

type BillItem = { slug: string; title: string; qty: number; price: number };

export default function POSPage() {
  const products = getProducts();
  const [query, setQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('All Products');
  const [sortBy, setSortBy] = useState('Name (A-Z)');
  const [bill, setBill] = useState<BillItem[]>([]);
  const [held, setHeld] = useState(() => {
    try {
      return readHeldBills();
    } catch {
      return [];
    }
  });

  const categories = ['All Products', 'Whole Spices', 'Spice Powders', 'Blends & Masala', 'Herbs', 'Seeds', 'Dry Fruits', 'Oils', 'Gift Packs', 'Others'];
  const filtered = products
    .filter((p) => (category === 'All Products' || (p.category || '').toLowerCase().includes(category.toLowerCase().split(' ')[0])) && (p.title.toLowerCase().includes(query.toLowerCase()) || p.slug.includes(query.toLowerCase())))
    .sort((a, b) => sortBy === 'Price (Low-High)' ? Number(a.price.replace(/[^0-9]/g, '')) - Number(b.price.replace(/[^0-9]/g, '')) : a.title.localeCompare(b.title));

  function addItem(p: Product, qty = 1, customWeightGram?: number) {
    setBill((cur) => {
      // compute price: if customWeightGram set and product has sizeOptions, derive per-kg
      const base = Number((p.price || '0').toString().replace(/[^0-9]/g, '')) || 0;
      let unitPrice = base;
      if (customWeightGram && customWeightGram > 0) {
        // base is assumed per-kg for seeded numeric values; compute proportional price
        unitPrice = Math.round((base * customWeightGram) / 1000);
      }

      const key = customWeightGram ? `${p.slug}@${customWeightGram}` : p.slug;
      const existing = cur.find((c) => c.slug === key);
      if (existing) {
        return cur.map((c) => (c.slug === key ? { ...c, qty: c.qty + qty } : c));
      }
      return [...cur, { slug: key, title: customWeightGram ? `${p.title} (${customWeightGram}g)` : p.title, qty, price: unitPrice }];
    });
  }

  function removeItem(slug: string) {
    setBill((cur) => cur.filter((c) => c.slug !== slug));
  }

  const subtotal = bill.reduce((s, it) => s + it.price * it.qty, 0);
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [message, setMessage] = useState<string | null>(null);

  async function completeSale() {
    if (bill.length === 0) return;
    setLoading(true);
    setMessage(null);
    try {
      const adminToken = typeof window !== "undefined" ? localStorage.getItem("sc_token") : null;
      const adminHeaders: HeadersInit = adminToken ? { authorization: `Bearer ${adminToken}` } : {};
      const items = bill.map((it) => {
        const baseSlug = it.slug.split('@')[0];
        return { slug: baseSlug, quantity: it.qty, price: it.price };
      });

      let paymentInfo: any = { method: paymentMethod, provider: 'none' };

      if (paymentMethod === 'card' || paymentMethod === 'upi') {
        // create mock payment
        const payRes = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: total, currency: 'INR' }),
        });
        const payData = await payRes.json();
        if (!payRes.ok || !payData.success) {
          setMessage(payData.error || 'Payment failed');
          setLoading(false);
          return;
        }
        paymentInfo = { method: paymentMethod, provider: payData.provider || 'mock', paymentId: payData.paymentId || payData.clientToken || null };
      }

      // allocate batches (FIFO by expiry/createdAt)
      const batchRes = await fetch('/api/admin/inventory/batches', { headers: adminHeaders });
      const batchData = await batchRes.json().catch(() => ({ batches: [] }));
      const batches: any[] = batchData?.batches || [];

      const allocations: Record<string, any[]> = {};
      for (const it of items) {
        let need = it.quantity;
        const candidate = batches
          .filter((b) => b.product === it.slug && (b.remaining || 0) > 0 && (!b.expiry || new Date(b.expiry) >= new Date()))
          .sort((a, b) => {
            const ea = a.expiry ? new Date(a.expiry).getTime() : Infinity;
            const eb = b.expiry ? new Date(b.expiry).getTime() : Infinity;
            if (ea !== eb) return ea - eb;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });

        allocations[it.slug] = [];
        for (const b of candidate) {
          if (need <= 0) break;
          const take = Math.min(need, b.remaining || 0);
          if (take <= 0) continue;
          allocations[it.slug].push({ batchId: b.id, qty: take });
          need -= take;
          // update local batch remaining for subsequent allocations
          b.remaining = (b.remaining || 0) - take;
        }
        // if need remains, we'll allow product-level stock to cover it (fallback)
        if (need > 0) allocations[it.slug].push({ batchId: null, qty: need });
      }

      // persist batch decrements
      for (const slug of Object.keys(allocations)) {
        for (const a of allocations[slug]) {
          if (!a.batchId) continue;
          try {
            // fetch current batch and calculate remaining already updated locally
            const b = batches.find((x) => x.id === a.batchId);
            if (!b) continue;
            await fetch('/api/admin/inventory/batches', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...adminHeaders }, body: JSON.stringify({ id: b.id, remaining: b.remaining }) });
          } catch {}
        }
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((it: any) => ({ ...it, allocations: allocations[it.slug] })), total, payment: paymentInfo }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || data?.message || 'Failed to create order');
        setLoading(false);
        return;
      }

      const orderId = data.orderId || data.order?.id || `ORDER_${Date.now()}`;

      // Build receipt HTML and open print window
      const receiptHtml = `
        <html>
          <head>
            <title>Receipt ${orderId}</title>
            <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}h2{margin-bottom:8px}</style>
          </head>
          <body>
            <h2>Spice Crowd — Receipt</h2>
            <div>Order: ${orderId}</div>
            <div>Date: ${new Date().toLocaleString()}</div>
            <div>Payment: ${paymentInfo.method} ${paymentInfo.paymentId ? `(${paymentInfo.paymentId})` : ''}</div>
            <hr />
            <div>
              ${items
                .map((it: any) => `<div style="display:flex;justify-content:space-between;padding:6px 0"><div>${it.slug}</div><div>×${it.quantity}</div><div>₹${it.price}</div></div>`)
                .join('')}
            </div>
            <hr />
            <div style="display:flex;justify-content:space-between"><strong>Total</strong><strong>₹${total}</strong></div>
            <div style="margin-top:20px">Thank you for shopping at Spice Crowd.</div>
            <script>window.onload = function(){ window.print(); }</script>
          </body>
        </html>
      `;

      const w = window.open('', '_blank');
      if (w) {
        w.document.open();
        w.document.write(receiptHtml);
        w.document.close();
      }

      setBill([]);
      setMessage(`Order ${orderId} created`);
    } catch (err) {
      setMessage(String(err));
    } finally {
      setLoading(false);
    }
  }

  function buildReceiptHtml(items: any[], orderId: string, paymentInfo: any, totalAmount: number) {
    return `
      <html>
        <head>
          <title>Receipt ${orderId}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>
            body{font-family:Arial,Helvetica,sans-serif;padding:20px}
            h2{margin-bottom:8px}
            .line{display:flex;justify-content:space-between;padding:6px 0}
            .small{font-size:12px;color:#666}
          </style>
        </head>
        <body>
          <h2>Spice Crowd — Receipt</h2>
          <div>Order: ${orderId}</div>
          <div>Date: ${new Date().toLocaleString()}</div>
          <div>Payment: ${paymentInfo?.method || 'cash'} ${paymentInfo?.paymentId ? `(${paymentInfo.paymentId})` : ''}</div>
          <hr />
          <div>
            ${items.map((it: any) => `<div class="line"><div>${it.slug}</div><div>×${it.quantity}</div><div>₹${it.price}</div></div>`).join('')}
          </div>
          <hr />
          <div class="line"><strong>Total</strong><strong>₹${totalAmount}</strong></div>
          <div class="small">Thank you for shopping at Spice Crowd.</div>
        </body>
      </html>
    `;
  }

  function downloadReceiptHtml(items: any[], orderId = `DRAFT_${Date.now()}`, paymentInfo = { method: 'cash' }, totalAmount = total) {
    const html = buildReceiptHtml(items, orderId, paymentInfo, totalAmount);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${orderId}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function holdBill() {
    if (bill.length === 0) return;
    const label = prompt('Label for held bill (e.g. Table 4, Customer name)') || `held ${new Date().toLocaleTimeString()}`;
    addHeldBill(label, bill);
    setHeld(readHeldBills());
    setBill([]);
  }

  function resumeHeld(id: string) {
    const items = readHeldBills();
    const found = items.find((i) => i.id === id);
    if (!found) return;
    setBill(found.bill);
    removeHeldBill(id);
    setHeld(readHeldBills());
  }

  function handleBarcodeEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    const code = barcode.trim();
    if (!code) return;
    const p = products.find((x) => x.slug === code);
    if (p) {
      addItem(p);
      setBarcode('');
      setQuery('');
    } else {
      alert('Product not found for SKU/slug: ' + code);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[color:var(--brand-deep-green)] px-5 py-4 text-white shadow-lg">
          <div><p className="text-xs uppercase tracking-[0.25em] text-[color:var(--brand-gold)]">Admin POS</p><h1 className="text-2xl font-black">Spice Crowd Billing</h1></div>
          <div className="flex flex-wrap gap-2"><button onClick={holdBill} className="rounded-lg bg-white/10 px-3 py-2 text-sm">Hold Bill</button><button onClick={() => setBill([])} className="rounded-lg bg-white/10 px-3 py-2 text-sm">New Bill</button><button onClick={completeSale} disabled={loading} className="rounded-lg bg-[color:var(--brand-gold)] px-3 py-2 text-sm font-bold text-[color:var(--brand-deep-green)]">Complete Sale</button></div>
        </div>
        <div className="grid grid-cols-12 gap-5">
        <section className="col-span-12 xl:col-span-8">
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1.5fr_180px]">
            <input value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={handleBarcodeEnter} placeholder="Scan barcode (F8)" className="rounded-lg border border-slate-200 bg-white px-3 py-2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search item or SKU" className="rounded-lg border border-slate-200 bg-white px-3 py-2" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2"><option>Name (A-Z)</option><option>Price (Low-High)</option></select>
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${category === item ? 'bg-[color:var(--brand-deep-green)] text-[color:var(--brand-gold)]' : 'text-slate-600 hover:bg-slate-100'}`}>{item}</button>)}</div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p.slug} className="rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                    <ImageWithFallback slug={p.slug} alt={p.title} className="w-20 h-20 object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-sm text-slate-500">{p.price}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => addItem(p)} className="rounded bg-[color:var(--brand-deep-green)] px-3 py-1 text-[color:var(--brand-gold)]">Add</button>
                      <button onClick={() => {
                        const grams = prompt('Enter grams (e.g. 375) for custom weight');
                        const g = grams ? Number(grams) : 0;
                        if (g > 0) addItem(p, 1, g);
                      }} className="rounded border px-3 py-1">Custom weight</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="col-span-12 xl:col-span-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Current Bill</h2><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Retail</span></div>
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2"><input placeholder="Walk-in Customer" className="rounded border px-3 py-2 text-sm" /><button className="rounded border px-3 py-2 text-sm">New Customer</button></div>
            <div className="mt-4 space-y-3">
              {bill.length === 0 && <div className="text-sm text-slate-500">No items added</div>}
              {bill.map((it) => (
                <div key={it.slug} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.title}</div>
                    <div className="text-sm text-slate-500">{it.qty} × ₹{it.price}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₹{it.qty * it.price}</div>
                    <button onClick={() => removeItem(it.slug)} className="text-sm text-[color:var(--brand-deep-green)]">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t pt-3">
              <div className="flex items-center justify-between"><span>Subtotal</span><strong>₹{subtotal}</strong></div>
              <div className="flex items-center justify-between"><span>GST (5%)</span><strong>₹{gst}</strong></div>
              <div className="mt-2 flex items-center justify-between text-lg font-bold"><span>Total</span><span>₹{total}</span></div>
              <div className="mt-4 grid gap-2">
                <div className="grid grid-cols-3 gap-2"><button type="button" onClick={() => setPaymentMethod('cash')} className={`rounded border px-2 py-2 text-xs ${paymentMethod === 'cash' ? 'border-[color:var(--brand-deep-green)] bg-emerald-50 font-semibold' : ''}`}>Cash</button><button type="button" onClick={() => setPaymentMethod('upi')} className={`rounded border px-2 py-2 text-xs ${paymentMethod === 'upi' ? 'border-[color:var(--brand-deep-green)] bg-emerald-50 font-semibold' : ''}`}>UPI</button><button type="button" onClick={() => setPaymentMethod('card')} className={`rounded border px-2 py-2 text-xs ${paymentMethod === 'card' ? 'border-[color:var(--brand-deep-green)] bg-emerald-50 font-semibold' : ''}`}>Card</button></div>
                <button onClick={completeSale} disabled={loading} className="rounded bg-[color:var(--brand-deep-green)] px-4 py-2 text-[color:var(--brand-gold)] disabled:opacity-60">{loading ? 'Processing…' : 'Complete Sale'}</button>
                <button onClick={holdBill} className="rounded border px-4 py-2">Hold Bill</button>
                {message && <div className="text-sm text-slate-700">{message}</div>}
                <div className="mt-2 flex gap-2">
                  <button onClick={() => downloadReceiptHtml(bill)} className="rounded border px-3 py-1">Download Receipt (HTML)</button>
                  <button
                    onClick={() =>
                      downloadReceiptPdf(
                        bill.map((it) => ({ slug: it.slug, quantity: it.qty, price: it.price })),
                      ).catch((e) => alert(String(e)))
                    }
                    className="rounded border px-3 py-1"
                  >
                    Download Receipt (PDF)
                  </button>
                </div>
              </div>
            </div>
            {held.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <h3 className="font-medium">Held Bills</h3>
                <div className="space-y-2 mt-2">
                  {held.map((h: any) => (
                    <div key={h.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{h.label}</div>
                        <div className="text-sm text-slate-500">{new Date(h.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => resumeHeld(h.id)} className="rounded bg-[color:var(--brand-deep-green)] px-3 py-1 text-[color:var(--brand-gold)]">Resume</button>
                        <button onClick={() => { removeHeldBill(h.id); setHeld(readHeldBills()); }} className="rounded border px-3 py-1 text-[color:var(--brand-deep-green)]">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

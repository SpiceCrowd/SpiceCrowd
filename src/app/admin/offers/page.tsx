"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type OfferType = 'percent' | 'flat' | 'bogo';
type OfferStatus = 'active' | 'draft' | 'paused';

type Offer = {
  id: string;
  title: string;
  slug: string;
  description: string;
  offerType: OfferType;
  value: number;
  minOrder: number;
  startAt: string;
  endAt: string;
  status: OfferStatus;
  featured: boolean;
};

type OfferForm = {
  title: string;
  slug: string;
  description: string;
  offerType: OfferType;
  value: string;
  minOrder: string;
  startAt: string;
  endAt: string;
  status: OfferStatus;
  featured: boolean;
};

const today = new Date().toISOString().slice(0, 10);
const plus14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

const emptyForm: OfferForm = {
  title: '',
  slug: '',
  description: '',
  offerType: 'percent',
  value: '10',
  minOrder: '0',
  startAt: today,
  endAt: plus14,
  status: 'active',
  featured: false,
};

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [createForm, setCreateForm] = useState<OfferForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<OfferForm>(emptyForm);

  const authHeader = useMemo(() => {
    if (typeof window === 'undefined') return {} as HeadersInit;
    const token = localStorage.getItem('sc_token');
    return token ? ({ authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/offers', { headers: authHeader });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setOffers([]);
        setError(data.error || 'Failed to load offers');
        return;
      }
      setOffers(Array.isArray(data.offers) ? data.offers : []);
    } catch {
      setOffers([]);
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOffers();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return offers;
    return offers.filter((offer) => `${offer.title} ${offer.slug} ${offer.offerType} ${offer.status}`.toLowerCase().includes(q));
  }, [offers, search]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const response = await fetch('/api/admin/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify(createForm),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setError(data.error || 'Failed to create offer');
      return;
    }

    setCreateForm(emptyForm);
    await loadOffers();
  };

  const startEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setEditForm({
      title: offer.title,
      slug: offer.slug,
      description: offer.description,
      offerType: offer.offerType,
      value: String(offer.value),
      minOrder: String(offer.minOrder),
      startAt: offer.startAt.slice(0, 10),
      endAt: offer.endAt.slice(0, 10),
      status: offer.status,
      featured: offer.featured,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError('');

    const response = await fetch('/api/admin/offers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ id: editingId, ...editForm }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setError(data.error || 'Failed to update offer');
      return;
    }

    cancelEdit();
    await loadOffers();
  };

  const removeOffer = async (id: string) => {
    setError('');

    const response = await fetch(`/api/admin/offers?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { ...authHeader },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setError(data.error || 'Failed to delete offer');
      return;
    }

    if (editingId === id) cancelEdit();
    await loadOffers();
  };

  const activeCount = offers.filter((offer) => offer.status === 'active').length;
  const featuredCount = offers.filter((offer) => offer.featured).length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_color-mix(in_srgb,var(--brand-gold)_22%,white),_transparent_28%),radial-gradient(circle_at_bottom_right,_color-mix(in_srgb,var(--brand-deep-green)_14%,white),_transparent_30%),linear-gradient(180deg,_#fff7ed,_#f8fafc)] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[1.6rem] border border-[color:var(--brand-gold)]/45 bg-gradient-to-br from-[color:var(--brand-deep-green)] via-[color:var(--brand-maroon)] to-[#7a5d2d] px-5 py-6 text-white shadow-[0_24px_80px_rgba(190,24,93,0.35)] sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-gold)]/90">Campaign Studio</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Offers and Discounts</h1>
              <p className="mt-2 text-sm text-[color:var(--brand-gold)]/90">Build and manage seasonal campaigns with quick edits.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Metric label="Total" value={String(offers.length)} />
              <Metric label="Active" value={String(activeCount)} />
              <Metric label="Featured" value={String(featuredCount)} />
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_2fr]">
          <form onSubmit={onCreate} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">New Offer</h2>
              <Link href="/admin" className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                Back to Admin
              </Link>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Input label="Title" value={createForm.title} onChange={(value) => setCreateForm((prev) => ({ ...prev, title: value }))} placeholder="Festive Bundle" />
              <Input label="Slug" value={createForm.slug} onChange={(value) => setCreateForm((prev) => ({ ...prev, slug: value }))} placeholder="festive-bundle" />
              <Input label="Value" value={createForm.value} onChange={(value) => setCreateForm((prev) => ({ ...prev, value: value }))} type="number" />
              <Input label="Min Order" value={createForm.minOrder} onChange={(value) => setCreateForm((prev) => ({ ...prev, minOrder: value }))} type="number" />
              <Input label="Start Date" value={createForm.startAt} onChange={(value) => setCreateForm((prev) => ({ ...prev, startAt: value }))} type="date" />
              <Input label="End Date" value={createForm.endAt} onChange={(value) => setCreateForm((prev) => ({ ...prev, endAt: value }))} type="date" />
            </div>

            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <Select
                label="Type"
                value={createForm.offerType}
                onChange={(value) => setCreateForm((prev) => ({ ...prev, offerType: value as OfferType }))}
                options={[
                  { label: 'Percent', value: 'percent' },
                  { label: 'Flat', value: 'flat' },
                  { label: 'BOGO (not live: never applied at checkout)', value: 'bogo' },
                ]}
              />
              <Select
                label="Status"
                value={createForm.status}
                onChange={(value) => setCreateForm((prev) => ({ ...prev, status: value as OfferStatus }))}
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Draft', value: 'draft' },
                  { label: 'Paused', value: 'paused' },
                ]}
              />
            </div>

            <label className="mt-2.5 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={createForm.featured}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, featured: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              Featured campaign
            </label>

            <div className="mt-2.5">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Description</span>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/25"
                />
              </label>
            </div>

            {error ? <p className="mt-3 rounded-lg border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/16 px-3 py-2 text-xs text-[color:var(--brand-deep-green)]">{error}</p> : null}

            <button type="submit" className="mt-3 w-full rounded-xl bg-[color:var(--brand-deep-green)] px-3 py-2 text-sm font-semibold text-[color:var(--brand-gold)] hover:bg-[color:var(--brand-maroon-700)]">
              Create Offer
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-slate-900">Campaigns</h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, slug..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:bg-white focus:ring-2 focus:ring-[color:var(--brand-gold)]/25 sm:w-72"
              />
            </div>

            {loading ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-500">Loading offers...</p>
            ) : filtered.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-500">No offers found.</p>
            ) : (
              <div className="space-y-2.5">
                {filtered.map((offer) => (
                  <div key={offer.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {editingId === offer.id ? (
                      <div className="space-y-2.5">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input label="Title" value={editForm.title} onChange={(value) => setEditForm((prev) => ({ ...prev, title: value }))} />
                          <Input label="Slug" value={editForm.slug} onChange={(value) => setEditForm((prev) => ({ ...prev, slug: value }))} />
                          <Input label="Value" value={editForm.value} onChange={(value) => setEditForm((prev) => ({ ...prev, value }))} type="number" />
                          <Input label="Min Order" value={editForm.minOrder} onChange={(value) => setEditForm((prev) => ({ ...prev, minOrder: value }))} type="number" />
                          <Input label="Start" value={editForm.startAt} onChange={(value) => setEditForm((prev) => ({ ...prev, startAt: value }))} type="date" />
                          <Input label="End" value={editForm.endAt} onChange={(value) => setEditForm((prev) => ({ ...prev, endAt: value }))} type="date" />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Select
                            label="Type"
                            value={editForm.offerType}
                            onChange={(value) => setEditForm((prev) => ({ ...prev, offerType: value as OfferType }))}
                            options={[
                              { label: 'Percent', value: 'percent' },
                              { label: 'Flat', value: 'flat' },
                              { label: 'BOGO (not live: never applied at checkout)', value: 'bogo' },
                            ]}
                          />
                          <Select
                            label="Status"
                            value={editForm.status}
                            onChange={(value) => setEditForm((prev) => ({ ...prev, status: value as OfferStatus }))}
                            options={[
                              { label: 'Active', value: 'active' },
                              { label: 'Draft', value: 'draft' },
                              { label: 'Paused', value: 'paused' },
                            ]}
                          />
                        </div>
                        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={editForm.featured}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, featured: e.target.checked }))}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          Featured campaign
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Description</span>
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/25"
                          />
                        </label>
                        <div className="flex gap-2">
                          <button type="button" onClick={saveEdit} className="rounded-lg bg-[color:var(--brand-deep-green)] px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-gold)] hover:bg-[color:var(--brand-maroon-700)]">
                            Save
                          </button>
                          <button type="button" onClick={cancelEdit} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{offer.title}</p>
                            <span className="rounded-full bg-[color:var(--brand-gold)]/22 px-2 py-0.5 text-[11px] font-semibold text-[color:var(--brand-deep-green)]">{offer.offerType}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${offer.status === 'active' ? 'bg-[color:var(--brand-deep-green)]/14 text-[color:var(--brand-deep-green)]' : offer.status === 'draft' ? 'bg-slate-200 text-slate-700' : 'bg-[color:var(--brand-gold)]/22 text-[color:var(--brand-deep-green)]'}`}>
                              {offer.status}
                            </span>
                            {offer.featured ? <span className="rounded-full bg-[color:var(--brand-gold)]/24 px-2 py-0.5 text-[11px] font-semibold text-[color:var(--brand-deep-green)]">featured</span> : null}
                          </div>
                          <p className="mt-1 text-xs text-slate-600">/{offer.slug}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {offer.offerType === 'percent' ? `${offer.value}% off` : offer.offerType === 'flat' ? `₹${offer.value} off` : 'Buy One Get One'} • Min ₹{offer.minOrder}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEdit(offer)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                            Edit
                          </button>
                          <button type="button" onClick={() => removeOffer(offer.id)} className="rounded-lg border border-[color:var(--brand-gold)]/50 px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-deep-green)] hover:bg-[color:var(--brand-gold)]/18">
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-center backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--brand-gold)]/90">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'date';
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/25"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold)]/25"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type CouponType = 'percent' | 'flat';
type CouponStatus = 'active' | 'paused';

type Coupon = {
  id: string;
  code: string;
  title: string;
  discountType: CouponType;
  discountValue: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number;
  usedCount: number;
  expiresAt: string | null;
  status: CouponStatus;
};

type CouponForm = {
  code: string;
  title: string;
  discountType: CouponType;
  discountValue: string;
  minOrder: string;
  maxDiscount: string;
  usageLimit: string;
  expiresAt: string;
  status: CouponStatus;
};

const emptyForm: CouponForm = {
  code: '',
  title: '',
  discountType: 'percent',
  discountValue: '10',
  minOrder: '0',
  maxDiscount: '',
  usageLimit: '100',
  expiresAt: '',
  status: 'active',
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [createForm, setCreateForm] = useState<CouponForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CouponForm>(emptyForm);

  const authHeader = useMemo(() => {
    if (typeof window === 'undefined') return {} as HeadersInit;
    const token = localStorage.getItem('sc_token');
    return token ? ({ authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/coupons', { headers: authHeader });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setCoupons([]);
        setError(data.error || 'Failed to load coupons');
        return;
      }
      setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
    } catch {
      setCoupons([]);
      setError('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCoupons();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter((coupon) => `${coupon.code} ${coupon.title} ${coupon.discountType} ${coupon.status}`.toLowerCase().includes(q));
  }, [coupons, search]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const response = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        ...createForm,
        code: createForm.code.toUpperCase(),
        maxDiscount: createForm.maxDiscount === '' ? null : createForm.maxDiscount,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setError(data.error || 'Failed to create coupon');
      return;
    }

    setCreateForm(emptyForm);
    await loadCoupons();
  };

  const startEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setEditForm({
      code: coupon.code,
      title: coupon.title,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrder: String(coupon.minOrder),
      maxDiscount: coupon.maxDiscount === null ? '' : String(coupon.maxDiscount),
      usageLimit: String(coupon.usageLimit),
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
      status: coupon.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError('');

    const response = await fetch('/api/admin/coupons', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        id: editingId,
        ...editForm,
        code: editForm.code.toUpperCase(),
        maxDiscount: editForm.maxDiscount === '' ? null : editForm.maxDiscount,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setError(data.error || 'Failed to update coupon');
      return;
    }

    cancelEdit();
    await loadCoupons();
  };

  const removeCoupon = async (id: string) => {
    setError('');
    const response = await fetch(`/api/admin/coupons?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { ...authHeader },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setError(data.error || 'Failed to delete coupon');
      return;
    }

    if (editingId === id) cancelEdit();
    await loadCoupons();
  };

  const activeCoupons = coupons.filter((coupon) => coupon.status === 'active').length;
  const totalRedemptions = coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_color-mix(in_srgb,var(--brand-gold)_18%,white),_transparent_30%),radial-gradient(circle_at_bottom_left,_color-mix(in_srgb,var(--brand-deep-green)_18%,white),_transparent_32%),linear-gradient(180deg,_#f8fafc,_#ecfeff)] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[1.6rem] border border-[color:var(--brand-gold)]/45 bg-gradient-to-br from-[color:var(--brand-deep-green)] via-[color:var(--brand-maroon)] to-[#7a5d2d] px-5 py-6 text-white shadow-[0_24px_80px_rgba(13,148,136,0.35)] sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-gold)]/90">Promotion Engine</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Coupons</h1>
              <p className="mt-2 text-sm text-[color:var(--brand-gold)]/90">Create and manage discounts with compact controls.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Metric label="Total" value={String(coupons.length)} />
              <Metric label="Active" value={String(activeCoupons)} />
              <Metric label="Used" value={String(totalRedemptions)} />
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_2fr]">
          <form onSubmit={onCreate} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">New Coupon</h2>
              <Link href="/admin" className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                Back to Admin
              </Link>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Input label="Code" value={createForm.code} onChange={(value) => setCreateForm((prev) => ({ ...prev, code: value }))} placeholder="SPICE20" />
              <Input label="Title" value={createForm.title} onChange={(value) => setCreateForm((prev) => ({ ...prev, title: value }))} placeholder="Weekend Offer" />
              <Input label="Discount" value={createForm.discountValue} onChange={(value) => setCreateForm((prev) => ({ ...prev, discountValue: value }))} type="number" />
              <Input label="Min Order" value={createForm.minOrder} onChange={(value) => setCreateForm((prev) => ({ ...prev, minOrder: value }))} type="number" />
              <Input label="Max Discount" value={createForm.maxDiscount} onChange={(value) => setCreateForm((prev) => ({ ...prev, maxDiscount: value }))} placeholder="Optional" type="number" />
              <Input label="Usage Limit" value={createForm.usageLimit} onChange={(value) => setCreateForm((prev) => ({ ...prev, usageLimit: value }))} type="number" />
            </div>

            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <Select
                label="Type"
                value={createForm.discountType}
                onChange={(value) => setCreateForm((prev) => ({ ...prev, discountType: value as CouponType }))}
                options={[
                  { label: 'Percent', value: 'percent' },
                  { label: 'Flat', value: 'flat' },
                ]}
              />
              <Select
                label="Status"
                value={createForm.status}
                onChange={(value) => setCreateForm((prev) => ({ ...prev, status: value as CouponStatus }))}
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Paused', value: 'paused' },
                ]}
              />
            </div>

            <div className="mt-2.5">
              <Input label="Expiry Date" value={createForm.expiresAt} onChange={(value) => setCreateForm((prev) => ({ ...prev, expiresAt: value }))} type="date" />
            </div>

            {error ? <p className="mt-3 rounded-lg border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/16 px-3 py-2 text-xs text-[color:var(--brand-deep-green)]">{error}</p> : null}

            <button type="submit" className="mt-3 w-full rounded-xl bg-[color:var(--brand-deep-green)] px-3 py-2 text-sm font-semibold text-[color:var(--brand-gold)] hover:bg-[color:var(--brand-maroon-700)]">
              Create Coupon
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-slate-900">Coupon List</h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code, title..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:bg-white focus:ring-2 focus:ring-[color:var(--brand-gold)]/25 sm:w-72"
              />
            </div>

            {loading ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-500">Loading coupons...</p>
            ) : filtered.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-500">No coupons found.</p>
            ) : (
              <div className="space-y-2.5">
                {filtered.map((coupon) => (
                  <div key={coupon.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {editingId === coupon.id ? (
                      <div className="space-y-2.5">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input label="Code" value={editForm.code} onChange={(value) => setEditForm((prev) => ({ ...prev, code: value }))} />
                          <Input label="Title" value={editForm.title} onChange={(value) => setEditForm((prev) => ({ ...prev, title: value }))} />
                          <Input label="Discount" value={editForm.discountValue} onChange={(value) => setEditForm((prev) => ({ ...prev, discountValue: value }))} type="number" />
                          <Input label="Min Order" value={editForm.minOrder} onChange={(value) => setEditForm((prev) => ({ ...prev, minOrder: value }))} type="number" />
                          <Input label="Max Discount" value={editForm.maxDiscount} onChange={(value) => setEditForm((prev) => ({ ...prev, maxDiscount: value }))} type="number" />
                          <Input label="Usage Limit" value={editForm.usageLimit} onChange={(value) => setEditForm((prev) => ({ ...prev, usageLimit: value }))} type="number" />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <Select
                            label="Type"
                            value={editForm.discountType}
                            onChange={(value) => setEditForm((prev) => ({ ...prev, discountType: value as CouponType }))}
                            options={[
                              { label: 'Percent', value: 'percent' },
                              { label: 'Flat', value: 'flat' },
                            ]}
                          />
                          <Select
                            label="Status"
                            value={editForm.status}
                            onChange={(value) => setEditForm((prev) => ({ ...prev, status: value as CouponStatus }))}
                            options={[
                              { label: 'Active', value: 'active' },
                              { label: 'Paused', value: 'paused' },
                            ]}
                          />
                          <Input label="Expiry" value={editForm.expiresAt} onChange={(value) => setEditForm((prev) => ({ ...prev, expiresAt: value }))} type="date" />
                        </div>
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
                            <p className="text-sm font-bold tracking-wide text-slate-900">{coupon.code}</p>
                            <span className="rounded-full bg-[color:var(--brand-gold)]/22 px-2 py-0.5 text-[11px] font-semibold text-[color:var(--brand-deep-green)]">{coupon.discountType}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${coupon.status === 'active' ? 'bg-[color:var(--brand-deep-green)]/14 text-[color:var(--brand-deep-green)]' : 'bg-[color:var(--brand-gold)]/22 text-[color:var(--brand-deep-green)]'}`}>
                              {coupon.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-slate-700">{coupon.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`} • Min ₹{coupon.minOrder} • Used {coupon.usedCount}/{coupon.usageLimit}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEdit(coupon)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                            Edit
                          </button>
                          <button type="button" onClick={() => removeCoupon(coupon.id)} className="rounded-lg border border-[color:var(--brand-gold)]/50 px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-deep-green)] hover:bg-[color:var(--brand-gold)]/18">
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

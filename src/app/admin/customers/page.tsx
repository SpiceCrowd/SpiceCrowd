"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type CustomerSegment = 'new' | 'regular' | 'vip';
type CustomerStatus = 'active' | 'inactive';

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: CustomerSegment;
  city: string;
  totalOrders: number;
  totalSpent: number;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
};

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  segment: CustomerSegment;
  city: string;
  totalOrders: string;
  totalSpent: string;
  status: CustomerStatus;
};

const emptyForm: CustomerForm = {
  name: '',
  email: '',
  phone: '',
  segment: 'new',
  city: '',
  totalOrders: '0',
  totalSpent: '0',
  status: 'active',
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState<CustomerForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CustomerForm>(emptyForm);

  const authHeader = useMemo(() => {
    if (typeof window === 'undefined') return {} as HeadersInit;
    const token = localStorage.getItem('sc_token');
    return token ? ({ authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/customers', { headers: authHeader });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setCustomers([]);
        setError(data.error || 'Failed to load customers');
        return;
      }
      setCustomers(Array.isArray(data.customers) ? data.customers : []);
    } catch {
      setCustomers([]);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCustomers();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      `${customer.name} ${customer.email} ${customer.phone} ${customer.city} ${customer.segment} ${customer.status}`
        .toLowerCase()
        .includes(q),
    );
  }, [customers, search]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const response = await fetch('/api/admin/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
      },
      body: JSON.stringify(createForm),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setError(data.error || 'Failed to create customer');
      return;
    }

    setCreateForm(emptyForm);
    await loadCustomers();
  };

  const onStartEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setEditForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      segment: customer.segment,
      city: customer.city,
      totalOrders: String(customer.totalOrders),
      totalSpent: String(customer.totalSpent),
      status: customer.status,
    });
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const onSaveEdit = async () => {
    if (!editingId) return;
    setError('');

    const response = await fetch('/api/admin/customers', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
      },
      body: JSON.stringify({ id: editingId, ...editForm }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setError(data.error || 'Failed to update customer');
      return;
    }

    onCancelEdit();
    await loadCustomers();
  };

  const onDelete = async (id: string) => {
    setError('');
    const response = await fetch(`/api/admin/customers?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        ...authHeader,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      setError(data.error || 'Failed to delete customer');
      return;
    }

    if (editingId === id) onCancelEdit();
    await loadCustomers();
  };

  const activeCount = customers.filter((customer) => customer.status === 'active').length;
  const vipCount = customers.filter((customer) => customer.segment === 'vip').length;
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_color-mix(in_srgb,var(--brand-gold)_18%,white),_transparent_30%),radial-gradient(circle_at_bottom_right,_color-mix(in_srgb,var(--brand-deep-green)_14%,white),_transparent_28%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[1.6rem] border border-[color:var(--brand-gold)]/45 bg-gradient-to-br from-[color:var(--brand-deep-green)] via-[color:var(--brand-maroon)] to-[#7a5d2d] px-5 py-6 text-white shadow-[0_22px_70px_rgba(3,105,161,0.35)] sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--brand-gold)]/90">Customer CRM</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Customers</h1>
              <p className="mt-2 max-w-2xl text-sm text-[color:var(--brand-gold)]/90">Manage customer records with compact CRUD flow and instant search.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Stat label="Total" value={String(customers.length)} />
              <Stat label="Active" value={String(activeCount)} />
              <Stat label="VIP" value={String(vipCount)} />
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_2fr]">
          <form onSubmit={onCreate} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Add Customer</h2>
              <Link href="/admin" className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                Back to Admin
              </Link>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label="Name" value={createForm.name} onChange={(value) => setCreateForm((prev) => ({ ...prev, name: value }))} placeholder="Full name" />
              <Field label="Email" value={createForm.email} onChange={(value) => setCreateForm((prev) => ({ ...prev, email: value }))} placeholder="email@example.com" />
              <Field label="Phone" value={createForm.phone} onChange={(value) => setCreateForm((prev) => ({ ...prev, phone: value }))} placeholder="+91 ..." />
              <Field label="City" value={createForm.city} onChange={(value) => setCreateForm((prev) => ({ ...prev, city: value }))} placeholder="City" />
              <Field label="Total Orders" value={createForm.totalOrders} onChange={(value) => setCreateForm((prev) => ({ ...prev, totalOrders: value }))} placeholder="0" type="number" />
              <Field label="Total Spent" value={createForm.totalSpent} onChange={(value) => setCreateForm((prev) => ({ ...prev, totalSpent: value }))} placeholder="0" type="number" />
            </div>

            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <SelectField
                label="Segment"
                value={createForm.segment}
                onChange={(value) => setCreateForm((prev) => ({ ...prev, segment: value as CustomerSegment }))}
                options={[
                  { label: 'New', value: 'new' },
                  { label: 'Regular', value: 'regular' },
                  { label: 'VIP', value: 'vip' },
                ]}
              />
              <SelectField
                label="Status"
                value={createForm.status}
                onChange={(value) => setCreateForm((prev) => ({ ...prev, status: value as CustomerStatus }))}
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
              />
            </div>

            {error ? <p className="mt-3 rounded-lg border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/16 px-3 py-2 text-xs text-[color:var(--brand-deep-green)]">{error}</p> : null}

            <button type="submit" className="mt-3 w-full rounded-xl bg-[color:var(--brand-deep-green)] px-3 py-2 text-sm font-semibold text-[color:var(--brand-gold)] hover:bg-[color:var(--brand-maroon-700)]">
              Create Customer
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-slate-900">Customer Directory</h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, city..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:bg-white focus:ring-2 focus:ring-[color:var(--brand-gold)]/25 sm:w-72"
              />
            </div>

            <div className="mb-3 rounded-xl border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/16 px-3 py-2 text-xs font-medium text-[color:var(--brand-deep-green)]">
              Lifetime customer value: ₹{Math.round(totalRevenue).toLocaleString('en-IN')}
            </div>

            {loading ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-500">Loading customers...</p>
            ) : filtered.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-500">No customers found.</p>
            ) : (
              <div className="space-y-2.5">
                {filtered.map((customer) => (
                  <div key={customer.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {editingId === customer.id ? (
                      <div className="space-y-2.5">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Field label="Name" value={editForm.name} onChange={(value) => setEditForm((prev) => ({ ...prev, name: value }))} placeholder="Full name" />
                          <Field label="Email" value={editForm.email} onChange={(value) => setEditForm((prev) => ({ ...prev, email: value }))} placeholder="email@example.com" />
                          <Field label="Phone" value={editForm.phone} onChange={(value) => setEditForm((prev) => ({ ...prev, phone: value }))} placeholder="+91 ..." />
                          <Field label="City" value={editForm.city} onChange={(value) => setEditForm((prev) => ({ ...prev, city: value }))} placeholder="City" />
                          <Field label="Total Orders" value={editForm.totalOrders} onChange={(value) => setEditForm((prev) => ({ ...prev, totalOrders: value }))} placeholder="0" type="number" />
                          <Field label="Total Spent" value={editForm.totalSpent} onChange={(value) => setEditForm((prev) => ({ ...prev, totalSpent: value }))} placeholder="0" type="number" />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <SelectField
                            label="Segment"
                            value={editForm.segment}
                            onChange={(value) => setEditForm((prev) => ({ ...prev, segment: value as CustomerSegment }))}
                            options={[
                              { label: 'New', value: 'new' },
                              { label: 'Regular', value: 'regular' },
                              { label: 'VIP', value: 'vip' },
                            ]}
                          />
                          <SelectField
                            label="Status"
                            value={editForm.status}
                            onChange={(value) => setEditForm((prev) => ({ ...prev, status: value as CustomerStatus }))}
                            options={[
                              { label: 'Active', value: 'active' },
                              { label: 'Inactive', value: 'inactive' },
                            ]}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={onSaveEdit} className="rounded-lg bg-[color:var(--brand-deep-green)] px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-gold)] hover:bg-[color:var(--brand-maroon-700)]">
                            Save
                          </button>
                          <button type="button" onClick={onCancelEdit} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                              customer.segment === 'vip'
                                ? 'bg-[color:var(--brand-gold)]/24 text-[color:var(--brand-deep-green)]'
                                : customer.segment === 'regular'
                                  ? 'bg-[color:var(--brand-deep-green)]/14 text-[color:var(--brand-deep-green)]'
                                  : 'bg-slate-200 text-slate-700'
                            }`}>
                              {customer.segment}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                              customer.status === 'active' ? 'bg-[color:var(--brand-deep-green)]/14 text-[color:var(--brand-deep-green)]' : 'bg-[color:var(--brand-gold)]/22 text-[color:var(--brand-deep-green)]'
                            }`}>
                              {customer.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">{customer.email} • {customer.phone || 'No phone'} • {customer.city || 'No city'}</p>
                          <p className="mt-1 text-xs text-slate-500">Orders: {customer.totalOrders} • Spent: ₹{Math.round(customer.totalSpent).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onStartEdit(customer)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(customer.id)}
                            className="rounded-lg border border-[color:var(--brand-gold)]/50 px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-deep-green)] hover:bg-[color:var(--brand-gold)]/18"
                          >
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-center backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--brand-gold)]/90">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function Field({
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
  type?: 'text' | 'number';
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

function SelectField({
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

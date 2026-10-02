"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Summary = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  pendingOrders: number;
  todayRevenue: number;
  todayOrders: number;
  last30Revenue: number;
  last30Orders: number;
  customers: number;
  activeCustomers: number;
  vipCustomers: number;
  products: number;
  lowStockCount: number;
  outOfStockCount: number;
  activeCoupons: number;
  activeOffers: number;
};

type TrendRow = {
  date: string;
  revenue: number;
  orders: number;
};

type StatusRow = {
  status: string;
  count: number;
};

type ReportResponse = {
  success: boolean;
  generatedAt?: string;
  summary?: Summary;
  trend30d?: TrendRow[];
  statuses?: StatusRow[];
  error?: string;
};

const defaultSummary: Summary = {
  totalRevenue: 0,
  totalOrders: 0,
  avgOrderValue: 0,
  pendingOrders: 0,
  todayRevenue: 0,
  todayOrders: 0,
  last30Revenue: 0,
  last30Orders: 0,
  customers: 0,
  activeCustomers: 0,
  vipCustomers: 0,
  products: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  activeCoupons: 0,
  activeOffers: 0,
};

function inr(value: number) {
  return `Rs ${Math.round(value).toLocaleString('en-IN')}`;
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [summary, setSummary] = useState<Summary>(defaultSummary);
  const [trend, setTrend] = useState<TrendRow[]>([]);
  const [statuses, setStatuses] = useState<StatusRow[]>([]);

  const authHeader = (): HeadersInit => {
    const token = localStorage.getItem('sc_token');
    return token ? { authorization: `Bearer ${token}` } : {};
  };

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/reports', { headers: authHeader() });
      const data = (await response.json().catch(() => ({}))) as ReportResponse;
      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to load reports');
        setSummary(defaultSummary);
        setTrend([]);
        setStatuses([]);
        return;
      }

      setGeneratedAt(data.generatedAt || '');
      setSummary(data.summary || defaultSummary);
      setTrend(Array.isArray(data.trend30d) ? data.trend30d : []);
      setStatuses(Array.isArray(data.statuses) ? data.statuses : []);
    } catch {
      setError('Failed to load reports');
      setSummary(defaultSummary);
      setTrend([]);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReports();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const peakRevenueDay = useMemo(() => {
    if (trend.length === 0) return null;
    return [...trend].sort((a, b) => b.revenue - a.revenue)[0] || null;
  }, [trend]);

  const recentRows = useMemo(() => trend.slice(-10).reverse(), [trend]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_color-mix(in_srgb,var(--brand-gold)_18%,white),_transparent_30%),radial-gradient(circle_at_bottom_left,_color-mix(in_srgb,var(--brand-deep-green)_14%,white),_transparent_30%),linear-gradient(180deg,_#f8fafc,_#eff6ff)] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[1.7rem] border border-[color:var(--brand-gold)]/45 bg-gradient-to-br from-[color:var(--brand-deep-green)] via-[color:var(--brand-maroon)] to-[#7a5d2d] px-5 py-6 text-white shadow-[0_26px_90px_rgba(30,64,175,0.35)] sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand-gold)]/90">Control Intelligence</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Reports and Analytics</h1>
              <p className="mt-2 text-sm text-[color:var(--brand-gold)]/90">Live snapshot for revenue, orders, customers, inventory, and campaigns.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void loadReports()} className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/25">
                Refresh
              </button>
              <Link href="/admin" className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[color:var(--brand-deep-green)] hover:bg-white">
                Back to Admin
              </Link>
            </div>
          </div>
          {generatedAt ? <p className="mt-3 text-xs text-[color:var(--brand-gold)]/90">Generated: {new Date(generatedAt).toLocaleString()}</p> : null}
        </section>

        {error ? <p className="mt-4 rounded-xl border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/16 px-4 py-3 text-sm text-[color:var(--brand-deep-green)]">{error}</p> : null}

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total Revenue" value={inr(summary.totalRevenue)} note={`Orders: ${summary.totalOrders}`} tone="blue" />
          <KpiCard title="Average Order Value" value={inr(summary.avgOrderValue)} note={`Pending: ${summary.pendingOrders}`} tone="violet" />
          <KpiCard title="Today" value={inr(summary.todayRevenue)} note={`Orders today: ${summary.todayOrders}`} tone="emerald" />
          <KpiCard title="Last 30 Days" value={inr(summary.last30Revenue)} note={`Orders: ${summary.last30Orders}`} tone="amber" />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Recent Daily Trend</h2>
              {peakRevenueDay ? (
                <span className="rounded-full bg-[color:var(--brand-gold)]/22 px-3 py-1 text-xs font-semibold text-[color:var(--brand-deep-green)]">
                  Peak: {peakRevenueDay.date} ({inr(peakRevenueDay.revenue)})
                </span>
              ) : null}
            </div>

            {loading ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-500">Loading trend...</p>
            ) : recentRows.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-500">No trend data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                      <th className="px-2 py-2">Date</th>
                      <th className="px-2 py-2">Revenue</th>
                      <th className="px-2 py-2">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRows.map((row) => (
                      <tr key={row.date} className="border-b border-slate-100 text-slate-700">
                        <td className="px-2 py-2 font-medium">{row.date}</td>
                        <td className="px-2 py-2">{inr(row.revenue)}</td>
                        <td className="px-2 py-2">{row.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Order Status Mix</h2>
            {loading ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-500">Loading statuses...</p>
            ) : statuses.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-sm text-slate-500">No status data available.</p>
            ) : (
              <div className="space-y-2">
                {statuses.map((row) => (
                  <div key={row.status} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="text-sm font-medium capitalize text-slate-700">{row.status}</span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">{row.count}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MiniCard title="Customers" line1={`Total: ${summary.customers}`} line2={`Active: ${summary.activeCustomers} | VIP: ${summary.vipCustomers}`} />
          <MiniCard title="Inventory" line1={`Products: ${summary.products}`} line2={`Low: ${summary.lowStockCount} | Out: ${summary.outOfStockCount}`} />
          <MiniCard title="Coupons" line1={`Active: ${summary.activeCoupons}`} line2="Track redemptions in coupon module" />
          <MiniCard title="Offers" line1={`Active: ${summary.activeOffers}`} line2="Track campaigns in offers module" />
        </section>
      </div>
    </main>
  );
}

function KpiCard({ title, value, note, tone }: { title: string; value: string; note: string; tone: 'blue' | 'violet' | 'emerald' | 'amber' }) {
  const toneClass =
    tone === 'blue'
      ? 'border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/14'
      : tone === 'violet'
        ? 'border-[color:var(--brand-deep-green)]/30 bg-[color:var(--brand-deep-green)]/10'
        : tone === 'emerald'
          ? 'border-[color:var(--brand-deep-green)]/30 bg-[color:var(--brand-deep-green)]/10'
          : 'border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-gold)]/14';

  return (
    <article className={`rounded-xl border p-3 shadow-sm ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">{title}</p>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{note}</p>
    </article>
  );
}

function MiniCard({ title, line1, line2 }: { title: string; line1: string; line2: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{line1}</p>
      <p className="mt-1 text-xs text-slate-500">{line2}</p>
    </article>
  );
}

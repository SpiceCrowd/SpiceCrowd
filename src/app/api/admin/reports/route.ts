import { NextResponse } from 'next/server';
import { readJson } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function toDate(input: unknown) {
  const value = typeof input === 'string' ? input : '';
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function dateLabel(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function currencyINR(value: number) {
  return Math.round(value);
}

type AnyRecord = Record<string, unknown>;

export async function GET(req: Request) {
  if (!isAdmin(req.headers.get('authorization'))) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  try {
    const [ordersRaw, productsRaw, customersRaw, couponsRaw, offersRaw] = await Promise.all([
      readJson<AnyRecord[]>('orders.json', []),
      readJson<AnyRecord[]>('products.json', []),
      readJson<AnyRecord[]>('customers.json', []),
      readJson<AnyRecord[]>('coupons.json', []),
      readJson<AnyRecord[]>('offers.json', []),
    ]);

    const orders = Array.isArray(ordersRaw) ? ordersRaw : [];
    const products = Array.isArray(productsRaw) ? productsRaw : [];
    const customers = Array.isArray(customersRaw) ? customersRaw : [];
    const coupons = Array.isArray(couponsRaw) ? couponsRaw : [];
    const offers = Array.isArray(offersRaw) ? offersRaw : [];

    const now = new Date();
    const last30Start = new Date(now.getTime() - 29 * 86400000);

    let totalRevenue = 0;
    let totalOrders = 0;
    let pendingOrders = 0;
    let todayRevenue = 0;
    let todayOrders = 0;

    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    const statusMap = new Map<string, number>();

    for (const order of orders) {
      const amount = toNumber(order.total, 0);
      const createdAt = toDate(order.createdAt);
      const status = typeof order.status === 'string' ? order.status : 'unknown';
      totalRevenue += amount;
      totalOrders += 1;
      statusMap.set(status, (statusMap.get(status) || 0) + 1);

      if (!['delivered', 'completed', 'fulfilled'].includes(status.toLowerCase())) {
        pendingOrders += 1;
      }

      if (createdAt) {
        const label = dateLabel(createdAt);
        const current = dailyMap.get(label) || { revenue: 0, orders: 0 };
        current.revenue += amount;
        current.orders += 1;
        dailyMap.set(label, current);

        if (label === dateLabel(now)) {
          todayRevenue += amount;
          todayOrders += 1;
        }
      }
    }

    const recentDays: Array<{ date: string; revenue: number; orders: number }> = [];
    for (let i = 29; i >= 0; i -= 1) {
      const day = new Date(now.getTime() - i * 86400000);
      const label = dateLabel(day);
      const row = dailyMap.get(label) || { revenue: 0, orders: 0 };
      recentDays.push({ date: label, revenue: currencyINR(row.revenue), orders: row.orders });
    }

    const last30 = recentDays.filter((row) => {
      const d = toDate(row.date);
      return Boolean(d && d >= last30Start);
    });

    const last30Revenue = last30.reduce((sum, row) => sum + row.revenue, 0);
    const last30Orders = last30.reduce((sum, row) => sum + row.orders, 0);

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const activeCustomers = customers.filter((c) => String(c.status || '').toLowerCase() === 'active').length;
    const vipCustomers = customers.filter((c) => String(c.segment || '').toLowerCase() === 'vip').length;

    const lowStockCount = products.filter((p) => toNumber(p.stock, 0) > 0 && toNumber(p.stock, 0) <= 10).length;
    const outOfStockCount = products.filter((p) => toNumber(p.stock, 0) <= 0).length;

    const activeCoupons = coupons.filter((c) => String(c.status || '').toLowerCase() === 'active').length;
    const activeOffers = offers.filter((o) => String(o.status || '').toLowerCase() === 'active').length;

    const statuses = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    const summary = {
      totalRevenue: currencyINR(totalRevenue),
      totalOrders,
      avgOrderValue: currencyINR(avgOrderValue),
      pendingOrders,
      todayRevenue: currencyINR(todayRevenue),
      todayOrders,
      last30Revenue: currencyINR(last30Revenue),
      last30Orders,
      customers: customers.length,
      activeCustomers,
      vipCustomers,
      products: products.length,
      lowStockCount,
      outOfStockCount,
      activeCoupons,
      activeOffers,
    };

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      summary,
      trend30d: recentDays,
      statuses,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';
import { notifyEmail } from '@/lib/notifications';

// GET: returns computed near-expiry alerts
export async function GET(req: Request) {
  if (!isAdmin(req.headers.get('authorization'))) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  const batches = await readJson('batches.json', [] as any[]);
  const now = Date.now();
  const near = batches.filter((b) => b.expiry && (new Date(b.expiry).getTime() - now) <= 1000 * 60 * 60 * 24 * 30);
  return NextResponse.json({ success: true, count: near.length, alerts: near.slice(0, 100) });
}

// POST: run alerts — write alerts.json and append to email-log.json as simulated notifications
export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    if (!isAdmin(auth)) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const thresholdDaysRaw = Number(body.thresholdDays ?? 30);
    const thresholdDays = Number.isFinite(thresholdDaysRaw)
      ? Math.min(365, Math.max(1, Math.floor(thresholdDaysRaw)))
      : 30;
    const batches = await readJson('batches.json', [] as any[]);
    const now = Date.now();
    const near = batches.filter((b) => b.expiry && (new Date(b.expiry).getTime() - now) <= 1000 * 60 * 60 * 24 * thresholdDays);

    const alerts = near.map((b) => ({ id: b.id, product: b.product, remaining: b.remaining, expiry: b.expiry, createdAt: new Date().toISOString() }));
    await writeJson('expiry-alerts.json', alerts);

    await Promise.all(alerts.map((a) => notifyEmail({
      to: process.env.INVENTORY_ALERT_EMAIL || 'inventory@spicecrowd.local',
      subject: `Expiry alert ${a.product}`,
      text: `Batch ${a.id} for ${a.product} expires on ${a.expiry} (${a.remaining} left).`,
      key: `expiry-alert:${a.id}:${a.expiry}`,
    })));

    return NextResponse.json({ success: true, message: `Alerts generated: ${alerts.length}`, count: alerts.length });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

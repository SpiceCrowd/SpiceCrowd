import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  if (!isAdmin(req.headers.get('authorization'))) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  const batches = await readJson('batches.json', [] as any[]);
  return NextResponse.json({ success: true, batches });
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    if (!isAdmin(auth)) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const product = typeof body.product === 'string' ? body.product.trim() : '';
    const quantity = Number(body.quantity || 0);
    const cost = Number(body.cost || 0);
    const expiry = body.expiry || null;
    if (!product) return NextResponse.json({ success: false, error: 'product required' }, { status: 400 });
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ success: false, error: 'quantity must be a positive number' }, { status: 400 });
    }
    if (!Number.isFinite(cost) || cost < 0) {
      return NextResponse.json({ success: false, error: 'cost must be a non-negative number' }, { status: 400 });
    }

    const batches = await readJson('batches.json', [] as any[]);
    const id = `BATCH_${Date.now()}`;
    const batch = { id, product, quantity, remaining: quantity, cost, expiry, createdAt: new Date().toISOString() };
    batches.unshift(batch);
    await writeJson('batches.json', batches);
    return NextResponse.json({ success: true, batch });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    if (!isAdmin(auth)) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

    const remaining = Number(body.remaining);
    if (!Number.isFinite(remaining) || remaining < 0) {
      return NextResponse.json({ success: false, error: 'remaining must be a non-negative number' }, { status: 400 });
    }

    const batches = await readJson('batches.json', [] as any[]);
    const exists = batches.some((b: any) => b.id === id);
    if (!exists) return NextResponse.json({ success: false, error: 'batch not found' }, { status: 404 });

    const updated = batches.map((b: any) => (b.id === id ? { ...b, remaining } : b));
    await writeJson('batches.json', updated);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

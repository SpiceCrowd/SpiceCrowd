import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/storage';
import { randomUUID } from 'crypto';
import { isAdmin } from '@/lib/auth';

async function getPrismaClient() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const db = await import('@/lib/db');
    return db.prisma;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    if (!isAdmin(auth)) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) {
      return NextResponse.json({ success: false, error: 'items required' }, { status: 400 });
    }

    const purchases = await readJson('purchases.json', [] as any[]);
    const id = `PUR_${randomUUID()}`;
    const items = rawItems.map((it: any) => ({
      slug: typeof it?.slug === 'string' ? it.slug.trim() : '',
      quantity: Number(it?.quantity || 0),
      cost: Number(it?.cost || 0),
      expiry: it?.expiry || null,
    }));

    const invalid = items.find(
      (it: any) =>
        !it.slug ||
        !Number.isFinite(it.quantity) ||
        it.quantity <= 0 ||
        !Number.isFinite(it.cost) ||
        it.cost < 0,
    );
    if (invalid) {
      return NextResponse.json({ success: false, error: 'invalid items payload' }, { status: 400 });
    }

    const total = items.reduce((s: number, it: any) => s + (it.cost || 0) * (it.quantity || 0), 0);
    const rec = { id, supplier: body.supplier || null, items, total, createdAt: new Date().toISOString(), note: body.note || null };

    // persist
    purchases.unshift(rec);
    await writeJson('purchases.json', purchases);

    // update product stock
    const prisma = await getPrismaClient();
    if (prisma) {
      for (const it of items) {
        await prisma.product.updateMany({ where: { slug: it.slug } as any, data: { stock: { increment: it.quantity } as any } as any } as any);
      }
    } else {
      const products = await readJson('products.json', null as any);
      const updated = (products || []).map((p: any) => {
        const found = items.find((i: any) => i.slug === p.slug);
        if (found) return { ...p, stock: Math.max(0, (p.stock || 0) + found.quantity) };
        return p;
      });
      await writeJson('products.json', updated);
    }

    // create batch records per item (for expiry tracking)
    try {
      const batches = await readJson('batches.json', [] as any[]);
      for (const it of items) {
        const batchId = `BATCH_${randomUUID()}`;
        const batch = {
          id: batchId,
          purchaseId: id,
          product: it.slug,
          quantity: it.quantity,
          remaining: it.quantity,
          cost: it.cost,
          expiry: it.expiry || null,
          createdAt: new Date().toISOString(),
        };
        batches.unshift(batch);
      }
      await writeJson('batches.json', batches);
    } catch {
      // ignore batch failures
    }

    return NextResponse.json({ success: true, purchase: rec });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!isAdmin(req.headers.get('authorization'))) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  const purchases = await readJson('purchases.json', [] as any[]);
  return NextResponse.json({ success: true, purchases });
}

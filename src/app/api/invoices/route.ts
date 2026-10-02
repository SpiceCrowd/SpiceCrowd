import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const db = await import('@/lib/db');
    return db.prisma;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const orderId = body.orderId;
  if (!orderId) return NextResponse.json({ success: false, error: 'orderId required' }, { status: 400 });

  const prisma = await getPrisma();
  let order: any = null;
  if (prisma) {
    order = await prisma.order.findUnique({ where: { id: orderId } as any });
  } else {
    const orders = await readJson<any[]>('orders.json', []);
    order = orders.find((o) => o.id === orderId);
  }
  if (!order) return NextResponse.json({ success: false, error: 'order not found' }, { status: 404 });

  const invoice = { id: `INV_${Date.now()}`, orderId, total: order.total, createdAt: new Date().toISOString(), data: order };

  if (prisma) {
    await prisma.invoice.create({ data: { orderId, total: Number(order.total || 0), data: JSON.stringify(order) } });
    return NextResponse.json({ success: true, invoice });
  }

  const invoices = await readJson<any[]>('invoices.json', []);
  invoices.push(invoice);
  await writeJson('invoices.json', invoices);
  return NextResponse.json({ success: true, invoice });
}

export async function GET(req: Request) {
  if (!isAdmin(req.headers.get('authorization') || req.headers.get('Authorization'))) {
    return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  }
  const prisma = await getPrisma();
  if (prisma) {
    const invoices = await prisma.invoice.findMany();
    return NextResponse.json({ success: true, invoices });
  }
  const invoices = await readJson<any[]>('invoices.json', []);
  return NextResponse.json({ success: true, invoices });
}

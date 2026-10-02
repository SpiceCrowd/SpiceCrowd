import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { readJson, writeJson } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: 'new' | 'regular' | 'vip';
  city: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

type CustomerPayload = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  segment?: string;
  city?: string;
  totalOrders?: number | string;
  totalSpent?: number | string;
  status?: string;
};

const CUSTOMER_FILE = 'customers.json';

function nowIso() {
  return new Date().toISOString();
}

function toTrimmedString(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function toNonNegativeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function normalizeSegment(value: unknown): Customer['segment'] {
  const input = toTrimmedString(value).toLowerCase();
  if (input === 'vip') return 'vip';
  if (input === 'regular') return 'regular';
  return 'new';
}

function normalizeStatus(value: unknown): Customer['status'] {
  return toTrimmedString(value).toLowerCase() === 'inactive' ? 'inactive' : 'active';
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(value: unknown) {
  return toTrimmedString(value).replace(/\s+/g, ' ');
}

async function seedCustomers() {
  const seeded: Customer[] = [
    {
      id: randomUUID(),
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '+91 98765 11111',
      segment: 'regular',
      city: 'Mumbai',
      totalOrders: 8,
      totalSpent: 5240,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: randomUUID(),
      name: 'Diya Kapoor',
      email: 'diya.kapoor@example.com',
      phone: '+91 98765 22222',
      segment: 'vip',
      city: 'Bengaluru',
      totalOrders: 21,
      totalSpent: 16450,
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: randomUUID(),
      name: 'Kabir Patel',
      email: 'kabir.patel@example.com',
      phone: '+91 98765 33333',
      segment: 'new',
      city: 'Ahmedabad',
      totalOrders: 1,
      totalSpent: 640,
      status: 'inactive',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];

  await writeJson(CUSTOMER_FILE, seeded);
  return seeded;
}

export async function GET(req: Request) {
  if (!isAdmin(req.headers.get('authorization'))) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  const customers = await readJson<Customer[]>(CUSTOMER_FILE, []);
  if (!customers || customers.length === 0) {
    const seeded = await seedCustomers();
    return NextResponse.json({ success: true, customers: seeded });
  }
  return NextResponse.json({ success: true, customers });
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || undefined;
  if (!isAdmin(auth)) {
    return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as CustomerPayload;
  const name = toTrimmedString(body.name);
  const email = toTrimmedString(body.email).toLowerCase();
  const phone = normalizePhone(body.phone);
  const city = toTrimmedString(body.city);

  if (!name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 });
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ success: false, error: 'valid email required' }, { status: 400 });
  }

  const customers = await readJson<Customer[]>(CUSTOMER_FILE, []);
  const duplicate = customers.find((c) => c.email.toLowerCase() === email);
  if (duplicate) {
    return NextResponse.json({ success: false, error: 'customer email already exists' }, { status: 409 });
  }

  const createdAt = nowIso();
  const customer: Customer = {
    id: randomUUID(),
    name,
    email,
    phone,
    segment: normalizeSegment(body.segment),
    city,
    totalOrders: toNonNegativeNumber(body.totalOrders, 0),
    totalSpent: toNonNegativeNumber(body.totalSpent, 0),
    status: normalizeStatus(body.status),
    createdAt,
    updatedAt: createdAt,
  };

  customers.unshift(customer);
  await writeJson(CUSTOMER_FILE, customers);
  return NextResponse.json({ success: true, created: customer });
}

export async function PUT(req: Request) {
  const auth = req.headers.get('authorization') || undefined;
  if (!isAdmin(auth)) {
    return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as CustomerPayload;
  const id = toTrimmedString(body.id);
  if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

  const customers = await readJson<Customer[]>(CUSTOMER_FILE, []);
  const existing = customers.find((c) => c.id === id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'customer not found' }, { status: 404 });
  }

  const nextEmail = body.email !== undefined ? toTrimmedString(body.email).toLowerCase() : existing.email;
  if (!nextEmail || !isValidEmail(nextEmail)) {
    return NextResponse.json({ success: false, error: 'valid email required' }, { status: 400 });
  }

  const duplicate = customers.find((c) => c.id !== id && c.email.toLowerCase() === nextEmail);
  if (duplicate) {
    return NextResponse.json({ success: false, error: 'customer email already exists' }, { status: 409 });
  }

  const updated: Customer = {
    ...existing,
    name: body.name !== undefined ? toTrimmedString(body.name) || existing.name : existing.name,
    email: nextEmail,
    phone: body.phone !== undefined ? normalizePhone(body.phone) : existing.phone,
    segment: body.segment !== undefined ? normalizeSegment(body.segment) : existing.segment,
    city: body.city !== undefined ? toTrimmedString(body.city) : existing.city,
    totalOrders: body.totalOrders !== undefined ? toNonNegativeNumber(body.totalOrders, 0) : existing.totalOrders,
    totalSpent: body.totalSpent !== undefined ? toNonNegativeNumber(body.totalSpent, 0) : existing.totalSpent,
    status: body.status !== undefined ? normalizeStatus(body.status) : existing.status,
    updatedAt: nowIso(),
  };

  const payload = customers.map((customer) => (customer.id === id ? updated : customer));
  await writeJson(CUSTOMER_FILE, payload);
  return NextResponse.json({ success: true, updated });
}

export async function DELETE(req: Request) {
  const auth = req.headers.get('authorization') || undefined;
  if (!isAdmin(auth)) {
    return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = toTrimmedString(url.searchParams.get('id'));
  if (!id) return NextResponse.json({ success: false, error: 'id query param required' }, { status: 400 });

  const customers = await readJson<Customer[]>(CUSTOMER_FILE, []);
  const exists = customers.some((c) => c.id === id);
  if (!exists) {
    return NextResponse.json({ success: false, error: 'customer not found' }, { status: 404 });
  }

  const payload = customers.filter((customer) => customer.id !== id);
  await writeJson(CUSTOMER_FILE, payload);
  return NextResponse.json({ success: true, deleted: id });
}

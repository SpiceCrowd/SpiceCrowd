import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { readJson, writeJson } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';

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
  createdAt: string;
  updatedAt: string;
};

type CouponPayload = {
  id?: string;
  code?: string;
  title?: string;
  discountType?: string;
  discountValue?: number | string;
  minOrder?: number | string;
  maxDiscount?: number | string | null;
  usageLimit?: number | string;
  expiresAt?: string | null;
  status?: string;
};

const COUPON_FILE = 'coupons.json';

function nowIso() {
  return new Date().toISOString();
}

function toTrimmedString(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function toNonNegativeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function normalizeCode(value: unknown) {
  return toTrimmedString(value).toUpperCase().replace(/\s+/g, '');
}

function normalizeType(value: unknown): CouponType {
  return toTrimmedString(value).toLowerCase() === 'flat' ? 'flat' : 'percent';
}

function normalizeStatus(value: unknown): CouponStatus {
  return toTrimmedString(value).toLowerCase() === 'paused' ? 'paused' : 'active';
}

function normalizeMaxDiscount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function normalizeExpiry(value: unknown): string | null {
  const text = toTrimmedString(value);
  if (!text) return null;
  const time = new Date(text).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

async function seedCoupons() {
  const now = nowIso();
  const seeded: Coupon[] = [
    {
      id: randomUUID(),
      code: 'SPICE10',
      title: 'Festival 10% Off',
      discountType: 'percent',
      discountValue: 10,
      minOrder: 799,
      maxDiscount: 300,
      usageLimit: 500,
      usedCount: 38,
      expiresAt: new Date(Date.now() + 15 * 86400000).toISOString(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      code: 'FIRST150',
      title: 'First Order Flat 150',
      discountType: 'flat',
      discountValue: 150,
      minOrder: 999,
      maxDiscount: null,
      usageLimit: 200,
      usedCount: 64,
      expiresAt: new Date(Date.now() + 45 * 86400000).toISOString(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
  ];

  await writeJson(COUPON_FILE, seeded);
  return seeded;
}

export async function GET(req: Request) {
  if (!isAdmin(req.headers.get('authorization'))) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  const coupons = await readJson<Coupon[]>(COUPON_FILE, []);
  if (!coupons || coupons.length === 0) {
    const seeded = await seedCoupons();
    return NextResponse.json({ success: true, coupons: seeded });
  }
  return NextResponse.json({ success: true, coupons });
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || undefined;
  if (!isAdmin(auth)) {
    return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as CouponPayload;
  const code = normalizeCode(body.code);
  const title = toTrimmedString(body.title);
  if (!code) return NextResponse.json({ success: false, error: 'code required' }, { status: 400 });
  if (!title) return NextResponse.json({ success: false, error: 'title required' }, { status: 400 });

  const coupons = await readJson<Coupon[]>(COUPON_FILE, []);
  const duplicate = coupons.find((coupon) => coupon.code === code);
  if (duplicate) {
    return NextResponse.json({ success: false, error: 'coupon code already exists' }, { status: 409 });
  }

  const discountType = normalizeType(body.discountType);
  const discountValue = toNonNegativeNumber(body.discountValue, 0);
  if (discountValue <= 0) {
    return NextResponse.json({ success: false, error: 'discount value must be greater than 0' }, { status: 400 });
  }

  const minOrder = toNonNegativeNumber(body.minOrder, 0);
  const usageLimit = toNonNegativeNumber(body.usageLimit, 0);
  const createdAt = nowIso();

  const coupon: Coupon = {
    id: randomUUID(),
    code,
    title,
    discountType,
    discountValue,
    minOrder,
    maxDiscount: normalizeMaxDiscount(body.maxDiscount),
    usageLimit,
    usedCount: 0,
    expiresAt: normalizeExpiry(body.expiresAt),
    status: normalizeStatus(body.status),
    createdAt,
    updatedAt: createdAt,
  };

  coupons.unshift(coupon);
  await writeJson(COUPON_FILE, coupons);
  return NextResponse.json({ success: true, created: coupon });
}

export async function PUT(req: Request) {
  const auth = req.headers.get('authorization') || undefined;
  if (!isAdmin(auth)) {
    return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as CouponPayload;
  const id = toTrimmedString(body.id);
  if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

  const coupons = await readJson<Coupon[]>(COUPON_FILE, []);
  const existing = coupons.find((coupon) => coupon.id === id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'coupon not found' }, { status: 404 });
  }

  const nextCode = body.code !== undefined ? normalizeCode(body.code) : existing.code;
  if (!nextCode) return NextResponse.json({ success: false, error: 'code required' }, { status: 400 });

  const duplicate = coupons.find((coupon) => coupon.id !== id && coupon.code === nextCode);
  if (duplicate) {
    return NextResponse.json({ success: false, error: 'coupon code already exists' }, { status: 409 });
  }

  const updated: Coupon = {
    ...existing,
    code: nextCode,
    title: body.title !== undefined ? toTrimmedString(body.title) || existing.title : existing.title,
    discountType: body.discountType !== undefined ? normalizeType(body.discountType) : existing.discountType,
    discountValue: body.discountValue !== undefined ? toNonNegativeNumber(body.discountValue, 0) : existing.discountValue,
    minOrder: body.minOrder !== undefined ? toNonNegativeNumber(body.minOrder, 0) : existing.minOrder,
    maxDiscount: body.maxDiscount !== undefined ? normalizeMaxDiscount(body.maxDiscount) : existing.maxDiscount,
    usageLimit: body.usageLimit !== undefined ? toNonNegativeNumber(body.usageLimit, 0) : existing.usageLimit,
    expiresAt: body.expiresAt !== undefined ? normalizeExpiry(body.expiresAt) : existing.expiresAt,
    status: body.status !== undefined ? normalizeStatus(body.status) : existing.status,
    updatedAt: nowIso(),
  };

  const payload = coupons.map((coupon) => (coupon.id === id ? updated : coupon));
  await writeJson(COUPON_FILE, payload);
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

  const coupons = await readJson<Coupon[]>(COUPON_FILE, []);
  const exists = coupons.some((coupon) => coupon.id === id);
  if (!exists) {
    return NextResponse.json({ success: false, error: 'coupon not found' }, { status: 404 });
  }

  const payload = coupons.filter((coupon) => coupon.id !== id);
  await writeJson(COUPON_FILE, payload);
  return NextResponse.json({ success: true, deleted: id });
}

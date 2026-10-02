import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { readJson, writeJson } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';

type OfferType = 'percent' | 'flat' | 'bogo';
type OfferStatus = 'active' | 'draft' | 'paused';

type Offer = {
  id: string;
  title: string;
  slug: string;
  description: string;
  offerType: OfferType;
  value: number;
  minOrder: number;
  startAt: string;
  endAt: string;
  status: OfferStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

type OfferPayload = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  offerType?: string;
  value?: number | string;
  minOrder?: number | string;
  startAt?: string;
  endAt?: string;
  status?: string;
  featured?: boolean | string;
};

const OFFER_FILE = 'offers.json';

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

function slugify(value: unknown) {
  return toTrimmedString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeType(value: unknown): OfferType {
  const input = toTrimmedString(value).toLowerCase();
  if (input === 'flat') return 'flat';
  if (input === 'bogo') return 'bogo';
  return 'percent';
}

function normalizeStatus(value: unknown): OfferStatus {
  const input = toTrimmedString(value).toLowerCase();
  if (input === 'draft') return 'draft';
  if (input === 'paused') return 'paused';
  return 'active';
}

function normalizeDate(value: unknown, fallback: string) {
  const parsed = new Date(toTrimmedString(value)).getTime();
  if (!Number.isFinite(parsed)) return fallback;
  return new Date(parsed).toISOString();
}

function normalizeFeatured(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  const text = toTrimmedString(value).toLowerCase();
  if (!text) return fallback;
  return text === 'true' || text === '1' || text === 'yes';
}

async function seedOffers() {
  const now = nowIso();
  const seeded: Offer[] = [
    {
      id: randomUUID(),
      title: 'Diwali Gourmet Bundle',
      slug: 'diwali-gourmet-bundle',
      description: 'Festive offer for premium spice bundles.',
      offerType: 'percent',
      value: 18,
      minOrder: 1499,
      startAt: now,
      endAt: new Date(Date.now() + 20 * 86400000).toISOString(),
      status: 'active',
      featured: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      title: 'Weekend Flat 200',
      slug: 'weekend-flat-200',
      description: 'Flat discount on weekend checkouts.',
      offerType: 'flat',
      value: 200,
      minOrder: 1800,
      startAt: now,
      endAt: new Date(Date.now() + 10 * 86400000).toISOString(),
      status: 'draft',
      featured: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  await writeJson(OFFER_FILE, seeded);
  return seeded;
}

export async function GET(req: Request) {
  if (!isAdmin(req.headers.get('authorization'))) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  const offers = await readJson<Offer[]>(OFFER_FILE, []);
  if (!offers || offers.length === 0) {
    const seeded = await seedOffers();
    return NextResponse.json({ success: true, offers: seeded });
  }
  return NextResponse.json({ success: true, offers });
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || undefined;
  if (!isAdmin(auth)) {
    return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as OfferPayload;
  const title = toTrimmedString(body.title);
  if (!title) return NextResponse.json({ success: false, error: 'title required' }, { status: 400 });

  const slug = slugify(body.slug) || slugify(title);
  if (!slug) return NextResponse.json({ success: false, error: 'valid slug required' }, { status: 400 });

  const offers = await readJson<Offer[]>(OFFER_FILE, []);
  const duplicate = offers.find((offer) => offer.slug === slug);
  if (duplicate) {
    return NextResponse.json({ success: false, error: 'offer slug already exists' }, { status: 409 });
  }

  const now = nowIso();
  const offer: Offer = {
    id: randomUUID(),
    title,
    slug,
    description: toTrimmedString(body.description),
    offerType: normalizeType(body.offerType),
    value: toNonNegativeNumber(body.value, 0),
    minOrder: toNonNegativeNumber(body.minOrder, 0),
    startAt: normalizeDate(body.startAt, now),
    endAt: normalizeDate(body.endAt, new Date(Date.now() + 14 * 86400000).toISOString()),
    status: normalizeStatus(body.status),
    featured: normalizeFeatured(body.featured, false),
    createdAt: now,
    updatedAt: now,
  };

  offers.unshift(offer);
  await writeJson(OFFER_FILE, offers);
  return NextResponse.json({ success: true, created: offer });
}

export async function PUT(req: Request) {
  const auth = req.headers.get('authorization') || undefined;
  if (!isAdmin(auth)) {
    return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as OfferPayload;
  const id = toTrimmedString(body.id);
  if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

  const offers = await readJson<Offer[]>(OFFER_FILE, []);
  const existing = offers.find((offer) => offer.id === id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'offer not found' }, { status: 404 });
  }

  const nextTitle = body.title !== undefined ? toTrimmedString(body.title) || existing.title : existing.title;
  const nextSlug = body.slug !== undefined ? slugify(body.slug) || existing.slug : existing.slug;

  const duplicate = offers.find((offer) => offer.id !== id && offer.slug === nextSlug);
  if (duplicate) {
    return NextResponse.json({ success: false, error: 'offer slug already exists' }, { status: 409 });
  }

  const updated: Offer = {
    ...existing,
    title: nextTitle,
    slug: nextSlug,
    description: body.description !== undefined ? toTrimmedString(body.description) : existing.description,
    offerType: body.offerType !== undefined ? normalizeType(body.offerType) : existing.offerType,
    value: body.value !== undefined ? toNonNegativeNumber(body.value, 0) : existing.value,
    minOrder: body.minOrder !== undefined ? toNonNegativeNumber(body.minOrder, 0) : existing.minOrder,
    startAt: body.startAt !== undefined ? normalizeDate(body.startAt, existing.startAt) : existing.startAt,
    endAt: body.endAt !== undefined ? normalizeDate(body.endAt, existing.endAt) : existing.endAt,
    status: body.status !== undefined ? normalizeStatus(body.status) : existing.status,
    featured: body.featured !== undefined ? normalizeFeatured(body.featured, existing.featured) : existing.featured,
    updatedAt: nowIso(),
  };

  const payload = offers.map((offer) => (offer.id === id ? updated : offer));
  await writeJson(OFFER_FILE, payload);
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

  const offers = await readJson<Offer[]>(OFFER_FILE, []);
  const exists = offers.some((offer) => offer.id === id);
  if (!exists) {
    return NextResponse.json({ success: false, error: 'offer not found' }, { status: 404 });
  }

  const payload = offers.filter((offer) => offer.id !== id);
  await writeJson(OFFER_FILE, payload);
  return NextResponse.json({ success: true, deleted: id });
}

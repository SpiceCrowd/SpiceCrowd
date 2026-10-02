import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { getProducts } from "@/lib/products";
import { invalidateCatalogCache } from "@/lib/catalogCache";

type Product = {
  slug: string;
  title: string;
  description?: string;
  price?: string;
  tag?: string;
  stock?: number;
};

type ProductPayload = {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  price?: string | number;
  tag?: string;
  stock?: number | string;
  status?: string;
  categoryId?: string;
};

function toNonNegativeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function toTrimmedString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

async function seedProducts() {
  const fromLib: Product[] = getProducts().map((product) => ({
    slug: product.slug,
    title: product.title,
    description: product.description,
    price: product.price,
    tag: product.tag,
    stock: 10,
  }));
  await writeJson("products.json", fromLib);
  return fromLib;
}

function slugify(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(req: Request) {
  if (!isAdmin(req.headers.get("authorization") || req.headers.get("Authorization"))) {
    return NextResponse.json({ success: false, error: "admin required" }, { status: 403 });
  }
  const products = (await readJson<Product[]>("products.json", [])).map((product) => ({
    ...product,
    stock: typeof product.stock === "number" ? product.stock : 10,
  }));
  if (!products || products.length === 0) {
    const seeded = await seedProducts();
    return NextResponse.json({ success: true, products: seeded });
  }
  return NextResponse.json({ success: true, products });
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || undefined;
  if (!isAdmin(auth)) return NextResponse.json({ success: false, error: "admin required" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as ProductPayload;
  const title = toTrimmedString(body.title);
  if (!title) return NextResponse.json({ success: false, error: "title required" }, { status: 400 });

  const slug = toTrimmedString(body.slug) || slugify(title);
  if (!slug) return NextResponse.json({ success: false, error: "valid slug required" }, { status: 400 });

  const parsedPrice = toNonNegativeNumber(body.price, 0);
  const parsedStock = toNonNegativeNumber(body.stock, 0);

  const products = await readJson<Product[]>("products.json", getProducts().map((product) => ({
    slug: product.slug,
    title: product.title,
    description: product.description,
    price: product.price,
    tag: product.tag,
    stock: 10,
  })));
  const existing = products.find((p) => p.slug === slug);
  if (existing) {
    return NextResponse.json({ success: false, error: "product slug already exists" }, { status: 409 });
  }
  const product: Product = {
    slug,
    title,
    description: toTrimmedString(body.description),
    price: String(parsedPrice),
    tag: toTrimmedString(body.tag),
    stock: parsedStock,
  };
  products.push(product);
  await writeJson("products.json", products);
  invalidateCatalogCache();
  return NextResponse.json({ success: true, created: product });
}

export async function PUT(req: Request) {
  const auth = req.headers.get("authorization") || undefined;
  if (!isAdmin(auth)) return NextResponse.json({ success: false, error: "admin required" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as ProductPayload;

  const products = await readJson<Product[]>("products.json", getProducts());
  const slug = toTrimmedString(body.slug);
  if (!slug) return NextResponse.json({ success: false, error: "slug required" }, { status: 400 });
  const existing = products.find((p) => p.slug === slug);
  if (!existing) return NextResponse.json({ success: false, error: "product not found" }, { status: 404 });

  const patch: Product = {
    ...existing,
    title: toTrimmedString(body.title) || existing.title,
    description: body.description !== undefined ? toTrimmedString(body.description) : existing.description,
    price: body.price !== undefined ? String(toNonNegativeNumber(body.price, 0)) : existing.price,
    tag: body.tag !== undefined ? toTrimmedString(body.tag) : existing.tag,
    stock: body.stock !== undefined ? toNonNegativeNumber(body.stock, 0) : existing.stock,
  };

  const updated = products.map((p) => (p.slug === slug ? patch : p));
  await writeJson("products.json", updated);
  invalidateCatalogCache();
  return NextResponse.json({ success: true, updated: patch });
}

export async function DELETE(req: Request) {
  const auth = req.headers.get("authorization") || undefined;
  if (!isAdmin(auth)) return NextResponse.json({ success: false, error: "admin required" }, { status: 403 });

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") || undefined;
  if (!slug) return NextResponse.json({ success: false, error: "slug query param required" }, { status: 400 });
  const products = await readJson<Product[]>("products.json", getProducts());
  const exists = products.some((p) => p.slug === slug);
  if (!exists) return NextResponse.json({ success: false, error: "product not found" }, { status: 404 });
  const filtered = products.filter((p) => p.slug !== slug);
  await writeJson("products.json", filtered);
  invalidateCatalogCache();
  return NextResponse.json({ success: true, deleted: slug });
}

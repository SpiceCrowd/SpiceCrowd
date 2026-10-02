import { readJson, updateJson, writeJson } from "@/lib/storage";
import { getProducts } from "@/lib/products";

type InventoryItem = { slug: string; quantity: number };

export async function reserveInventory(items: InventoryItem[]) {
  let availableError: string | null = null;
  const prisma = await getPrisma();
  const databaseProducts = prisma && items.length
    ? await prisma.product.findMany({ where: { slug: { in: items.map((item) => item.slug) } } as any, select: { slug: true } } as any)
    : [];
  if (prisma && items.length && databaseProducts.length === new Set(items.map((item) => item.slug)).size) {
    try {
      await prisma.$transaction(async (transaction: any) => {
        for (const item of items) {
          const result = await transaction.product.updateMany({
            where: { slug: item.slug, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count !== 1) throw new Error(`Only 0 available for ${item.slug}`);
        }
      });
    } catch (error) {
      availableError = error instanceof Error ? error.message : "inventory unavailable";
    }
  }
  if (availableError) return { reserved: false, error: availableError };
  await updateJson<any[]>("products.json", getProducts(), (products) => {
    const next = products.map((product) => ({ ...product }));
    for (const item of items) {
      const product = next.find((candidate) => candidate.slug === item.slug);
      if (!product) continue;
      const available = typeof product.stock === "number" ? product.stock : 10;
      if (available < item.quantity) {
        availableError = `Only ${available} available for ${item.slug}`;
        return products;
      }
    }
    for (const item of items) {
      const product = next.find((candidate) => candidate.slug === item.slug);
      if (product) product.stock = (typeof product.stock === "number" ? product.stock : 10) - item.quantity;
    }
    return next;
  });
  return { reserved: !availableError, error: availableError };
}

export async function releaseInventory(items: InventoryItem[]) {
  const prisma = await getPrisma();
  if (prisma && items.length) {
    await prisma.$transaction(async (transaction: any) => {
      for (const item of items) {
        await transaction.product.updateMany({ where: { slug: item.slug } as any, data: { stock: { increment: item.quantity } } });
      }
    });
  }
  await updateJson<any[]>("products.json", getProducts(), (products) => products.map((product) => {
    const item = items.find((candidate) => candidate.slug === product.slug);
    return item ? { ...product, stock: (typeof product.stock === "number" ? product.stock : 10) + item.quantity } : product;
  }));
}

type InventoryOrder = {
  payment?: { success?: boolean };
  items?: Array<{ slug?: string; quantity?: number }>;
  inventoryRestoredAt?: string;
};

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const db = await import("@/lib/db");
    return db.prisma;
  } catch {
    return null;
  }
}

export async function restoreOrderInventory(order: InventoryOrder) {
  if (!order.payment?.success || order.inventoryRestoredAt || !Array.isArray(order.items)) return false;

  const items = order.items
    .map((item) => ({ slug: String(item.slug || ""), quantity: Math.max(0, Number(item.quantity || 0)) }))
    .filter((item) => item.slug && item.quantity > 0);
  if (!items.length) return false;

  const prisma = await getPrisma();
  const fallbackProducts = await readJson<any[]>("products.json", getProducts());
  for (const item of items) {
    if (prisma) {
      await prisma.product.updateMany({ where: { slug: item.slug } as any, data: { stock: { increment: item.quantity } as any } as any } as any);
    }
    const index = fallbackProducts.findIndex((candidate) => candidate.slug === item.slug);
    if (index >= 0) {
      const current = typeof fallbackProducts[index].stock === "number" ? fallbackProducts[index].stock : 0;
      fallbackProducts[index] = { ...fallbackProducts[index], stock: current + item.quantity };
    }
  }
  await writeJson("products.json", fallbackProducts);
  order.inventoryRestoredAt = new Date().toISOString();
  return true;
}
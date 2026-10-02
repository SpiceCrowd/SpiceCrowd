import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.BASE_URL || "http://localhost:3108";
const slug = "kolli-hills-turmeric";
const attempts = Number(process.env.ATTEMPTS || 20);
const prisma = new PrismaClient();
const storageKey = "products.json";

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}

async function readProducts() {
  const row = await prisma.storage.findUnique({ where: { key: storageKey } });
  return row?.data ? JSON.parse(row.data) : [];
}

async function writeStock(stock) {
  const products = await readProducts();
  const updated = products.map((product) => product.slug === slug ? { ...product, stock } : product);
  await prisma.storage.upsert({ where: { key: storageKey }, create: { key: storageKey, data: JSON.stringify(updated) }, update: { data: JSON.stringify(updated) } });
}

const originalProducts = await readProducts();
const originalStock = originalProducts.find((product) => product.slug === slug)?.stock;
try {
  await writeStock(1);
  const payments = [];
  for (let index = 0; index < attempts; index += 1) {
    const payment = await api("/api/payments", { method: "POST", body: JSON.stringify({ amount: 139, currency: "INR" }) });
    payments.push(payment.body.paymentId);
  }
  const started = performance.now();
  const orders = await Promise.all(payments.map((paymentId, index) => api("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      customer: { name: `Race User ${index}`, email: `inventory-race-${Date.now()}-${index}@example.com`, phone: `900${String(index).padStart(7, "0")}`, address: `${index} Race Street`, city: "Chennai", postal: "600001" },
      items: [{ slug, title: "Kolli Hills Turmeric", price: 89, priceLabel: "₹89", quantity: 1 }],
      payment: { success: true, paymentId, method: "dummy" },
      shipping: { method: "standard", cost: 50 },
    }),
  })));
  const elapsed = performance.now() - started;
  const successes = orders.filter((result) => result.status === 200 && result.body?.success && !result.body?.idempotent);
  const stock = (await api(`/api/products?slug=${slug}`)).body.product?.stock;
  const variantProbe = await api("/api/orders", { method: "POST", body: JSON.stringify({ items: [{ slug, title: "Turmeric 1kg variant", price: 349, quantity: 1, priceLabel: "₹349", sku: "TURMERIC-1KG" }], payment: { success: false }, shipping: { cost: 50 }, customer: { name: "Variant Probe", email: `variant-probe-${Date.now()}@example.com`, phone: "9000000000", address: "Variant Street", city: "Chennai", postal: "600001" } }) });
  console.log(JSON.stringify({ attempts, durationMs: Number(elapsed.toFixed(2)), successOrders: successes.length, failedOrders: orders.length - successes.length, statuses: orders.reduce((counts, result) => { counts[result.status] = (counts[result.status] || 0) + 1; return counts; }, {}), finalStock: stock, oversold: successes.length > 1 || Number(stock) < 0, variantProbe: { status: variantProbe.status, orderStatus: variantProbe.body.order?.status, acceptedSku: variantProbe.body.order?.items?.[0]?.sku || null } }, null, 2));
} finally {
  await writeStock(originalStock ?? 10000);
  await prisma.$disconnect();
}

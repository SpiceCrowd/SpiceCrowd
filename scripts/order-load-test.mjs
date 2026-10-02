import { performance } from "node:perf_hooks";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const baseUrl = process.env.BASE_URL || "http://localhost:3106";
const serverPid = Number(process.env.SERVER_PID || 0);
const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS || 15000);
const count = Number(process.env.COUNT || 100);
const slug = "kolli-hills-turmeric";
const unitPrice = 89;
const shipping = 50;
const expectedTotal = unitPrice + shipping;
const runId = `order-load-${Date.now()}`;

async function sampleServer() {
  if (!serverPid) return null;
  try {
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `(Get-Process -Id ${serverPid} | Select-Object CPU,WorkingSet64 | ConvertTo-Json -Compress)`]);
    const sample = JSON.parse(stdout.trim());
    return { cpuSeconds: Number(sample.CPU || 0), rssBytes: Number(sample.WorkingSet64 || 0) };
  } catch { return null; }
}

async function request(path, options = {}) {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, { ...options, signal: controller.signal, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, elapsed: performance.now() - started, body };
  } catch (error) {
    return { ok: false, status: 0, elapsed: performance.now() - started, error: String(error) };
  } finally { clearTimeout(timer); }
}

async function register(index) {
  const email = `${runId}-${index}@example.com`;
  const password = `OrderLoad-${index}-Strong!`;
  const result = await request("/api/auth", { method: "POST", body: JSON.stringify({ action: "register", email, password, name: `Order Load ${index}`, phone: `900${String(index).padStart(7, "0")}`, countryCode: "+91" }) });
  return { email, password, token: result.body?.token, registration: result };
}

async function checkout(account, index) {
  const customer = { name: `Order Load ${index}`, email: account.email, phone: `900${String(index).padStart(7, "0")}`, address: `${index} Synthetic Test Street`, city: "Chennai", postal: "600001" };
  const payment = await request("/api/payments", { method: "POST", body: JSON.stringify({ amount: expectedTotal, currency: "INR" }) });
  if (!payment.body?.paymentId) return { index, payment, order: null, elapsed: payment.elapsed };
  const order = await request("/api/orders", { method: "POST", headers: { authorization: `Bearer ${account.token}` }, body: JSON.stringify({ customer, items: [{ slug, title: "Kolli Hills Turmeric", price: unitPrice, quantity: 1, priceLabel: "₹89" }], payment: { success: true, paymentId: payment.body.paymentId, method: "dummy" }, shipping: { method: "standard", cost: shipping } }) });
  return { index, payment, order, elapsed: payment.elapsed + order.elapsed, expectedEmail: account.email, expectedTotal };
}

const accounts = [];
for (let index = 0; index < count; index += 1) accounts.push(await register(index));
const before = await sampleServer();
const started = performance.now();
const results = await Promise.all(accounts.map((account, index) => checkout(account, index)));
const duration = performance.now() - started;
const after = await sampleServer();
const orders = results.map((result) => result.order?.body?.order).filter(Boolean);
const ids = orders.map((order) => order.id);
const uniqueIds = new Set(ids);
const valid = results.filter((result) => result.payment?.status === 200 && result.order?.status === 200 && result.order.body?.success && result.order.body?.order?.total === expectedTotal && result.order.body?.order?.email === result.expectedEmail);
const failures = results.filter((result) => !valid.includes(result));
const latencies = results.map((result) => result.elapsed);
const sort = [...latencies].sort((a, b) => a - b);
const percentile = (p) => sort[Math.min(sort.length - 1, Math.floor((sort.length - 1) * p))] || 0;
console.log(JSON.stringify({ runId, count, durationSeconds: Number((duration / 1000).toFixed(3)), ordersPerSecond: Number((valid.length / (duration / 1000)).toFixed(2)), successfulOrders: valid.length, failedOrders: failures.length, uniqueOrderIds: uniqueIds.size, duplicateOrderIds: ids.length - uniqueIds.size, integrityFailures: results.length - valid.length, latencyMs: { p50: Number(percentile(.5).toFixed(2)), p95: Number(percentile(.95).toFixed(2)), max: Number(Math.max(...latencies).toFixed(2)) }, statusCounts: results.reduce((counts, result) => { const key = `${result.payment?.status || 0}/${result.order?.status || 0}`; counts[key] = (counts[key] || 0) + 1; return counts; }, {}), server: { before, after, peakRssMiB: Number((Math.max(before?.rssBytes || 0, after?.rssBytes || 0) / 1024 / 1024).toFixed(2)) } }, null, 2));

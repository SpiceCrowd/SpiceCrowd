import { performance } from "node:perf_hooks";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const base = process.env.BASE_URL || "http://localhost:3109";
const serverPid = Number(process.env.SERVER_PID || 0);
const customers = Number(process.env.CUSTOMERS || 20);
const timeoutMs = 10000;
const slug = "kolli-hills-turmeric";

async function sampleServer() {
  if (!serverPid) return null;
  try {
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `(Get-Process -Id ${serverPid} | Select-Object CPU,WorkingSet64 | ConvertTo-Json -Compress)`]);
    const s = JSON.parse(stdout.trim());
    return { cpuSeconds: Number(s.CPU || 0), rssBytes: Number(s.WorkingSet64 || 0) };
  } catch { return null; }
}

async function api(path, options = {}) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${base}${path}`, { ...options, signal: controller.signal, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    return { status: response.status, elapsed: performance.now() - start, body: await response.json().catch(() => ({})) };
  } catch (error) { return { status: 0, elapsed: performance.now() - start, error: String(error) }; }
  finally { clearTimeout(timer); }
}

const operations = [];
const record = (kind, result) => operations.push({ kind, ...result });
const run = async (kind, path, options) => { const result = await api(path, options); record(kind, result); return result; };

const accounts = [];
for (let i = 0; i < customers; i += 1) {
  const email = `mixed-${Date.now()}-${i}@example.com`;
  const password = `Mixed-${i}-Strong!`;
  const registered = await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "register", email, password, name: `Mixed User ${i}`, phone: `910${String(i).padStart(7, "0")}`, countryCode: "+91" }) });
  accounts.push({ email, password, token: registered.body?.token });
}
const adminLogin = await api("/api/auth", { method: "POST", body: JSON.stringify({ action: "admin-login", email: "admin@spicecrowd.local", password: "SpiceCrowdAdmin123!" }) });
const admin = { authorization: `Bearer ${adminLogin.body?.token}` };
const before = await sampleServer();
const started = performance.now();
await Promise.all([
  ...accounts.map(async (account, i) => {
    const headers = { authorization: `Bearer ${account.token}` };
    await Promise.all([
      run("customer-products", `/api/products?slug=${slug}`),
      run("customer-search", "/api/search?q=turmeric"),
      run("customer-profile", "/api/user", { headers }),
      run("customer-orders", "/api/orders", { headers }),
      run("customer-order-detail", "/api/orders/does-not-exist", { headers }),
      (async () => {
        const payment = await run("customer-payment", "/api/payments", { method: "POST", body: JSON.stringify({ amount: 139, currency: "INR" }) });
        if (payment.body?.paymentId) await run("customer-order", "/api/orders", { method: "POST", headers, body: JSON.stringify({ customer: { name: `Mixed User ${i}`, email: account.email, phone: `910${String(i).padStart(7, "0")}`, address: `${i} Mixed Street`, city: "Chennai", postal: "600001" }, items: [{ slug, title: "Kolli Hills Turmeric", price: 89, quantity: 1 }], payment: { success: true, paymentId: payment.body.paymentId, method: "dummy" }, shipping: { cost: 50 } }) });
      })(),
    ]);
  }),
  ...Array.from({ length: 10 }, () => Promise.all([
    run("admin-reports", "/api/admin/reports", { headers: admin }),
    run("admin-products", "/api/admin/products", { headers: admin }),
    run("admin-batches", "/api/admin/inventory/batches", { headers: admin }),
    run("admin-alerts", "/api/admin/inventory/alerts", { headers: admin }),
  ])),
  ...Array.from({ length: 10 }, async (_, i) => {
    const payment = await run("pos-payment", "/api/payments", { method: "POST", body: JSON.stringify({ amount: 139, currency: "INR" }) });
    if (payment.body?.paymentId) await run("pos-order", "/api/orders", { method: "POST", headers: admin, body: JSON.stringify({ customer: { name: `POS Mixed ${i}`, email: `pos-mixed-${Date.now()}-${i}@example.com`, phone: `920${String(i).padStart(7, "0")}`, address: "POS Street", city: "Chennai", postal: "600001" }, items: [{ slug, title: "Kolli Hills Turmeric", price: 89, quantity: 1 }], payment: { success: true, paymentId: payment.body.paymentId, method: "cash" }, shipping: { cost: 0 } }) });
  }),
]);
const duration = performance.now() - started;
const after = await sampleServer();
const byKind = {};
for (const operation of operations) (byKind[operation.kind] ||= []).push(operation);
const summary = Object.fromEntries(Object.entries(byKind).map(([kind, rows]) => { const latencies = rows.map((r) => r.elapsed).sort((a, b) => a - b); const failures = rows.filter((r) => r.status < 200 || r.status >= 400).length; return [kind, { count: rows.length, failures, failureRatePercent: Number((failures / rows.length * 100).toFixed(2)), p50Ms: Number(latencies[Math.floor(latencies.length * .5)]?.toFixed(2) || 0), p95Ms: Number(latencies[Math.floor(latencies.length * .95)]?.toFixed(2) || 0), statuses: rows.reduce((x, r) => { x[r.status] = (x[r.status] || 0) + 1; return x; }, {}) }]; }));
console.log(JSON.stringify({ customers, totalOperations: operations.length, durationSeconds: Number((duration / 1000).toFixed(3)), operationsPerSecond: Number((operations.length / (duration / 1000)).toFixed(2)), summary, server: { before, after, rssPeakMiB: Number((Math.max(before?.rssBytes || 0, after?.rssBytes || 0) / 1024 / 1024).toFixed(2)) } }, null, 2));

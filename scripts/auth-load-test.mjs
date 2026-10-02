import { performance } from "node:perf_hooks";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const baseUrl = process.env.BASE_URL || "http://localhost:3103";
const serverPid = Number(process.env.SERVER_PID || 0);
const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS || 10000);
const levels = (process.env.LEVELS || "100,500,1000,2500,5000").split(",").map(Number).filter(Number.isFinite);
const runId = `auth-load-${Date.now()}`;

async function sampleServer() {
  if (!serverPid) return null;
  try {
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `(Get-Process -Id ${serverPid} | Select-Object CPU,WorkingSet64 | ConvertTo-Json -Compress)`]);
    const sample = JSON.parse(stdout.trim());
    return { cpuSeconds: Number(sample.CPU || 0), rssBytes: Number(sample.WorkingSet64 || 0) };
  } catch { return null; }
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
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

async function registerAccount(index) {
  const email = `${runId}-${index}@example.com`;
  const result = await request("/api/auth", { method: "POST", body: JSON.stringify({ action: "register", email, password: `TestPassword-${index}-Strong`, name: `Load User ${index}`, phone: String(9000000000 + (index % 999999999)), countryCode: "+91" }) });
  return { email, password: `TestPassword-${index}-Strong`, result };
}

async function loginAndSession(account) {
  const login = await request("/api/auth", { method: "POST", body: JSON.stringify({ action: "login", email: account.email, password: account.password }) });
  const token = login.body?.token;
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  const [profile, orders] = token
    ? await Promise.all([request("/api/user", { headers }), request("/api/orders", { headers })])
    : [{ ok: false, status: 0 }, { ok: false, status: 0 }];
  return { email: account.email, login, profile, orders, token };
}

async function runLevel(vus) {
  const registrationCount = Number(process.env.REGISTER_ACCOUNTS || 0);
  const preparedCount = Number(process.env.PREPARE_ACCOUNTS || 0);
  const accounts = preparedCount
    ? await (async () => { const prepared = []; for (let i = 0; i < preparedCount; i += 1) prepared.push(await registerAccount(i)); return prepared; })()
    : registrationCount
      ? await Promise.all(Array.from({ length: registrationCount }, (_, i) => registerAccount(i)))
      : Array.from({ length: vus }, (_, i) => ({ email: `existing-load-${i}@example.com`, password: `TestPassword-${i}-Strong`, result: { ok: true } }));
  const samples = [];
  const before = await sampleServer();
  const started = performance.now();
  const sampler = setInterval(async () => { const sample = await sampleServer(); if (sample) samples.push(sample); }, 500);
  const sessions = await Promise.all(Array.from({ length: vus }, (_, i) => loginAndSession(accounts[i % accounts.length])));
  clearInterval(sampler);
  const elapsed = performance.now() - started;
  const loginResults = sessions.map((session) => session.login);
  const authenticated = sessions.filter((session) => session.login.ok && session.profile.status === 200 && session.orders.status === 200);
  const identityMatches = sessions.filter((session) => session.profile.body?.user?.email === session.email);
  const failures = sessions.filter((session) => !session.login.ok || session.profile.status !== 200 || session.orders.status !== 200);
  const after = await sampleServer();
  const latencies = loginResults.map((result) => result.elapsed);
  const peakRss = Math.max(before?.rssBytes || 0, after?.rssBytes || 0, ...samples.map((s) => s.rssBytes));
  return { vus, registrationCount, durationSeconds: Number((elapsed / 1000).toFixed(3)), loginThroughputPerSecond: Number((vus / (elapsed / 1000)).toFixed(2)), loginFailures: failures.length, loginFailureRatePercent: Number((failures.length / vus * 100).toFixed(2)), authenticatedSessions: authenticated.length, identityMatches: identityMatches.length, latencyMs: { min: Number(Math.min(...latencies).toFixed(2)), p50: Number(percentile(latencies, .5).toFixed(2)), p95: Number(percentile(latencies, .95).toFixed(2)), p99: Number(percentile(latencies, .99).toFixed(2)), max: Number(Math.max(...latencies).toFixed(2)) }, statusCounts: loginResults.reduce((counts, r) => { counts[r.status] = (counts[r.status] || 0) + 1; return counts; }, {}), server: { before, after, peakRssMiB: Number((peakRss / 1024 / 1024).toFixed(2)), samples: samples.length } };
}

const results = [];
for (const level of levels) { console.log(`Running ${level} concurrent authentication sessions...`); const result = await runLevel(level); results.push(result); console.log(JSON.stringify(result)); }
console.log(JSON.stringify({ baseUrl, runId, results }, null, 2));

import { performance } from "node:perf_hooks";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
const base = process.env.BASE_URL || "http://localhost:3114";
const pid = Number(process.env.SERVER_PID || 0);
const users = Number(process.env.USERS || 10);
const durationMs = Number(process.env.DURATION_MS || 7200000);
const intervalMs = Number(process.env.INTERVAL_MS || 5000);
const timeoutMs = 10000;
const paths = ["/", "/products", "/api/products", "/api/search?q=turmeric", "/api/products?slug=kolli-hills-turmeric"];
async function sample() { try { const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `(Get-Process -Id ${pid} | Select-Object CPU,WorkingSet64 | ConvertTo-Json -Compress)`]); const x = JSON.parse(stdout.trim()); return { cpuSeconds: Number(x.CPU || 0), rssBytes: Number(x.WorkingSet64 || 0) }; } catch { return null; } }
async function request(path) { const start = performance.now(); const c = new AbortController(); const t = setTimeout(() => c.abort(), timeoutMs); try { const r = await fetch(base + path, { signal: c.signal }); await r.arrayBuffer(); return { ok: r.ok, status: r.status, ms: performance.now() - start }; } catch { return { ok: false, status: 0, ms: performance.now() - start }; } finally { clearTimeout(t); } }
function pct(values, p) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] || 0; }
const started = Date.now();
const samples = [];
let requests = 0;
let failures = 0;
let latency = [];
let intervalCount = 0;
while (Date.now() - started < durationMs) {
  const results = (await Promise.all(Array.from({ length: users }, () => Promise.all(paths.map(request))))).flat();
  requests += results.length;
  failures += results.filter((r) => !r.ok || r.status >= 400).length;
  latency.push(...results.map((r) => r.ms));
  intervalCount += 1;
  const server = await sample();
  const elapsedHours = (Date.now() - started) / 3600000;
  const point = { interval: intervalCount, elapsedHours: Number(elapsedHours.toFixed(4)), requests, failures, failureRatePercent: Number((failures / requests * 100).toFixed(3)), p95Ms: Number(pct(latency, .95).toFixed(2)), server: server ? { rssMiB: Number((server.rssBytes / 1048576).toFixed(2)), cpuSeconds: server.cpuSeconds } : null };
  samples.push(point);
  console.log(JSON.stringify(point));
  latency = [];
  await new Promise((resolve) => setTimeout(resolve, intervalMs));
}
console.log(JSON.stringify({ durationHours: Number(((Date.now() - started) / 3600000).toFixed(4)), users, requests, failures, failureRatePercent: Number((failures / requests * 100).toFixed(3)), samples }, null, 2));

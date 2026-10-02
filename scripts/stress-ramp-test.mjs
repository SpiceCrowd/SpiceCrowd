import { performance } from "node:perf_hooks";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const base = process.env.BASE_URL || "http://localhost:3110";
const serverPid = Number(process.env.SERVER_PID || 0);
const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS || 5000);
const levels = (process.env.LEVELS || "1,5,10,25,50,100,200").split(",").map(Number);
const requestsPerUser = 5;
const paths = ["/", "/products", "/api/products", "/api/search?q=turmeric", "/api/products?slug=kolli-hills-turmeric"];

async function sampleServer() {
  if (!serverPid) return null;
  try {
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `(Get-Process -Id ${serverPid} | Select-Object CPU,WorkingSet64 | ConvertTo-Json -Compress)`]);
    const sample = JSON.parse(stdout.trim());
    return { cpuSeconds: Number(sample.CPU || 0), rssBytes: Number(sample.WorkingSet64 || 0) };
  } catch { return null; }
}

async function request(path) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${base}${path}`, { signal: controller.signal });
    await response.arrayBuffer();
    return { status: response.status, ok: response.ok, elapsed: performance.now() - start };
  } catch (error) {
    return { status: 0, ok: false, elapsed: performance.now() - start, error: String(error) };
  } finally { clearTimeout(timer); }
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] || 0;
}

async function runLevel(users) {
  const before = await sampleServer();
  const start = performance.now();
  const results = await Promise.all(Array.from({ length: users }, async () => Promise.all(Array.from({ length: requestsPerUser }, (_, i) => request(paths[i])))));
  const duration = performance.now() - start;
  const flat = results.flat();
  const latencies = flat.map((item) => item.elapsed);
  const failures = flat.filter((item) => !item.ok || item.status >= 400);
  const after = await sampleServer();
  const metrics = {
    users,
    requests: flat.length,
    durationSeconds: Number((duration / 1000).toFixed(3)),
    throughputPerSecond: Number((flat.length / (duration / 1000)).toFixed(2)),
    failures: failures.length,
    failureRatePercent: Number((failures.length / flat.length * 100).toFixed(2)),
    timeoutLikeFailures: flat.filter((item) => item.status === 0).length,
    statusCounts: flat.reduce((counts, item) => { counts[item.status] = (counts[item.status] || 0) + 1; return counts; }, {}),
    latencyMs: { p50: Number(percentile(latencies, .5).toFixed(2)), p95: Number(percentile(latencies, .95).toFixed(2)), p99: Number(percentile(latencies, .99).toFixed(2)), max: Number(Math.max(...latencies).toFixed(2)) },
    server: { before, after, rssMiB: Number(((after?.rssBytes || 0) / 1024 / 1024).toFixed(2)), cpuSecondsDelta: Number(((after?.cpuSeconds || 0) - (before?.cpuSeconds || 0)).toFixed(2)) },
  };
  console.log(JSON.stringify(metrics));
  return metrics;
}

const results = [];
for (const level of levels) results.push(await runLevel(level));
const recovery = [];
for (let i = 0; i < 3; i += 1) recovery.push(await runLevel(1));
console.log(JSON.stringify({ base, timeoutMs, requestsPerUser, ramp: results, recovery }, null, 2));

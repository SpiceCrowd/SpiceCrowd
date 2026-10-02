import { performance } from "node:perf_hooks";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const baseUrl = process.env.BASE_URL || "http://localhost:3100";
const serverPid = Number(process.env.SERVER_PID || 0);
const levels = (process.env.LEVELS || "100,500,1000,2500,5000").split(",").map(Number).filter(Number.isFinite);
const productSlug = "kolli-hills-turmeric";
const paths = [
  "/",
  "/products",
  "/api/products",
  "/api/search?q=turmeric",
  `/products/${productSlug}`,
  `/api/products?slug=${productSlug}`,
];

async function sampleServer() {
  if (!serverPid) return null;
  try {
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `(Get-Process -Id ${serverPid} | Select-Object CPU,WorkingSet64 | ConvertTo-Json -Compress)`]);
    const sample = JSON.parse(stdout.trim());
    return { cpuSeconds: Number(sample.CPU || 0), rssBytes: Number(sample.WorkingSet64 || 0) };
  } catch {
    return null;
  }
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
}

async function request(path) {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.REQUEST_TIMEOUT_MS || 10000));
  try {
    const response = await fetch(`${baseUrl}${path}`, { headers: { connection: "keep-alive" }, signal: controller.signal });
    const elapsed = performance.now() - started;
    await response.arrayBuffer();
    return { ok: response.ok, status: response.status, elapsed, path };
  } catch (error) {
    return { ok: false, status: 0, elapsed: performance.now() - started, path, error: String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

async function runLevel(vus) {
  const samples = [];
  const before = await sampleServer();
  const started = performance.now();
  const sampler = setInterval(async () => {
    const sample = await sampleServer();
    if (sample) samples.push({ at: performance.now(), ...sample });
  }, 500);
  const userResults = await Promise.all(Array.from({ length: vus }, async () => Promise.all(paths.map(request))));
  clearInterval(sampler);
  const elapsed = performance.now() - started;
  const requests = userResults.flat();
  const latencies = requests.map((result) => result.elapsed);
  const failures = requests.filter((result) => !result.ok || result.status >= 400);
  const after = await sampleServer();
  const peakRssBytes = Math.max(before?.rssBytes || 0, after?.rssBytes || 0, ...samples.map((sample) => sample.rssBytes));
  const peakCpuSeconds = Math.max(before?.cpuSeconds || 0, after?.cpuSeconds || 0, ...samples.map((sample) => sample.cpuSeconds));
  return {
    vus,
    requests: requests.length,
    durationSeconds: Number((elapsed / 1000).toFixed(3)),
    throughputRequestsPerSecond: Number((requests.length / (elapsed / 1000)).toFixed(2)),
    failures: failures.length,
    failureRatePercent: Number((failures.length / requests.length * 100).toFixed(2)),
    latencyMs: {
      min: Number(Math.min(...latencies).toFixed(2)),
      p50: Number(percentile(latencies, 0.5).toFixed(2)),
      p95: Number(percentile(latencies, 0.95).toFixed(2)),
      p99: Number(percentile(latencies, 0.99).toFixed(2)),
      max: Number(Math.max(...latencies).toFixed(2)),
    },
    statusCounts: requests.reduce((counts, result) => { counts[result.status] = (counts[result.status] || 0) + 1; return counts; }, {}),
    server: {
      before,
      after,
      peakRssMiB: Number((peakRssBytes / 1024 / 1024).toFixed(2)),
      peakCpuSeconds: Number(peakCpuSeconds.toFixed(2)),
      samples: samples.length,
    },
  };
}

const results = [];
for (const level of levels) {
  console.log(`Running ${level} concurrent virtual users (${paths.length} read requests each)...`);
  results.push(await runLevel(level));
  console.log(JSON.stringify(results.at(-1)));
}
console.log(JSON.stringify({ baseUrl, paths, results }, null, 2));

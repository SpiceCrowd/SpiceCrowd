import { performance } from "node:perf_hooks";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
const base = process.env.BASE_URL || "http://localhost:3112";
const pid = Number(process.env.SERVER_PID || 0);
const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS || 5000);
const levels = (process.env.LEVELS || "100,1000,5000").split(",").map(Number);
const paths = ["/", "/api/search?q=turmeric", "/api/products?slug=kolli-hills-turmeric", "/products", "/api/products"];
async function sample() { try { if (!pid) return null; const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `(Get-Process -Id ${pid} | Select-Object CPU,WorkingSet64 | ConvertTo-Json -Compress)`]); const x = JSON.parse(stdout.trim()); return { cpuSeconds: Number(x.CPU || 0), rssBytes: Number(x.WorkingSet64 || 0) }; } catch { return null; } }
async function request(path) { const started = performance.now(); const c = new AbortController(); const timer = setTimeout(() => c.abort(), timeoutMs); try { const r = await fetch(base + path, { signal: c.signal }); await r.arrayBuffer(); return { status: r.status, ok: r.ok, ms: performance.now() - started }; } catch (error) { return { status: 0, ok: false, ms: performance.now() - started, error: String(error) }; } finally { clearTimeout(timer); } }
function pct(a, p) { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor((s.length - 1) * p))] || 0; }
async function level(users) { const before = await sample(); const started = performance.now(); const results = await Promise.all(Array.from({ length: users }, () => Promise.all(paths.map(request)))); const duration = performance.now() - started; const rows = results.flat(); const lat = rows.map(x => x.ms); const fails = rows.filter(x => !x.ok || x.status >= 400); const after = await sample(); return { users, requests: rows.length, durationSeconds: +(duration / 1000).toFixed(3), throughput: +(rows.length / (duration / 1000)).toFixed(2), failures: fails.length, failureRate: +(fails.length / rows.length * 100).toFixed(2), statuses: rows.reduce((m, x) => { m[x.status] = (m[x.status] || 0) + 1; return m; }, {}), latencyMs: { p50: +pct(lat, .5).toFixed(2), p95: +pct(lat, .95).toFixed(2), p99: +pct(lat, .99).toFixed(2), max: +Math.max(...lat).toFixed(2) }, server: { before, after, rssMiB: +((after?.rssBytes || 0) / 1048576).toFixed(2), cpuDelta: +((after?.cpuSeconds || 0) - (before?.cpuSeconds || 0)).toFixed(2) } }; }
const ramp = []; for (const users of levels) { const r = await level(users); ramp.push(r); console.log(JSON.stringify(r)); }
const recovery = []; for (let i = 0; i < 3; i++) recovery.push(await level(1));
console.log(JSON.stringify({ base, timeoutMs, paths, ramp, recovery }, null, 2));

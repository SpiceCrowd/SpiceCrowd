import { promises as fs } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const updateQueues = new Map<string, Promise<void>>();
const readCache = new Map<string, { expiresAt: number; value: unknown }>();
const readInflight = new Map<string, Promise<unknown>>();
const READ_CACHE_TTL_MS = 100;

async function ensureDataDir() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch {}
}

async function getPrismaClient() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const db = await import("./db");
    return db.prisma;
  } catch {
    return null;
  }
}

export async function readJson<T>(filename: string, fallback: T): Promise<T> {
  const cached = readCache.get(filename);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;
  const inflight = readInflight.get(filename);
  if (inflight) return (await inflight) as T;

  const read = readJsonUncached(filename, fallback);
  readInflight.set(filename, read);
  try {
    const value = await read;
    readCache.set(filename, { expiresAt: Date.now() + READ_CACHE_TTL_MS, value });
    return value;
  } finally {
    readInflight.delete(filename);
  }
}

async function readJsonUncached<T>(filename: string, fallback: T): Promise<T> {
  const prisma = await getPrismaClient();
  if (prisma) {
    try {
      const rec = await prisma.storage.findUnique({ where: { key: filename } });
      if (!rec?.data) return fallback;
      try {
        return JSON.parse(rec.data as string) as T;
      } catch {
        return fallback;
      }
    } catch {
      return fallback;
    }
  }

  await ensureDataDir();
  const file = path.join(dataDir, filename);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(filename: string, data: T): Promise<void> {
  readCache.delete(filename);
  const prisma = await getPrismaClient();
  if (prisma) {
    await prisma.storage.upsert({ where: { key: filename }, create: { key: filename, data: JSON.stringify(data) }, update: { data: JSON.stringify(data) } });
    return;
  }

  await ensureDataDir();
  const file = path.join(dataDir, filename);
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

export async function updateJson<T>(filename: string, fallback: T, updater: (current: T) => T | Promise<T>): Promise<T> {
  const previous = updateQueues.get(filename) || Promise.resolve();
  let result!: T;
  const next = previous.then(async () => {
    const current = await readJson(filename, fallback);
    result = await updater(current);
    await writeJson(filename, result);
  });
  updateQueues.set(filename, next.catch(() => undefined));
  await next;
  return result;
}

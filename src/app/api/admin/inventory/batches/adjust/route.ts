import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    if (!isAdmin(auth)) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { id, delta = 0, reason } = body;
    const batchId = typeof id === 'string' ? id.trim() : '';
    if (!batchId) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

    const parsedDelta = Number(delta);
    if (!Number.isFinite(parsedDelta) || parsedDelta === 0) {
      return NextResponse.json({ success: false, error: 'delta must be a non-zero number' }, { status: 400 });
    }

    const batches = await readJson('batches.json', [] as any[]);
    const found = batches.find((b) => b.id === batchId);
    if (!found) return NextResponse.json({ success: false, error: 'not found' }, { status: 404 });

    const before = Number(found.remaining || 0);
    const after = Math.max(0, before + parsedDelta);

    const updated = batches.map((b) => (b.id === batchId ? { ...b, remaining: after } : b));
    await writeJson('batches.json', updated);

    // append adjustment log
    try {
      const logs = await readJson('batch-adjustments.json', [] as any[]);
      const normalizedReason = typeof reason === 'string' ? reason.trim().slice(0, 240) : null;
      logs.unshift({ id: `ADJ_${Date.now()}`, batchId, delta: parsedDelta, before, after, reason: normalizedReason, at: new Date().toISOString() });
      await writeJson('batch-adjustments.json', logs);
    } catch {}

    // DB sync intentionally skipped: current schema has no Batch model.

    return NextResponse.json({ success: true, before, after });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

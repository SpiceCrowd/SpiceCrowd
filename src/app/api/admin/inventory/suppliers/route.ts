import { NextResponse } from 'next/server';
import { readJson, writeJson } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  if (!isAdmin(req.headers.get('authorization'))) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  const suppliers = await readJson('suppliers.json', [] as any[]);
  return NextResponse.json({ success: true, suppliers });
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    if (!isAdmin(auth)) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 });

    const suppliers = await readJson('suppliers.json', [] as any[]);
    const id = `SUP_${Date.now()}`;
    const s = {
      id,
      name,
      contact: typeof body.contact === 'string' ? body.contact.trim() || null : null,
      note: typeof body.note === 'string' ? body.note.trim() || null : null,
      createdAt: new Date().toISOString(),
    };
    suppliers.unshift(s);
    await writeJson('suppliers.json', suppliers);
    return NextResponse.json({ success: true, supplier: s });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { readJson } from '@/lib/storage';
import { isAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  if (!isAdmin(req.headers.get('authorization'))) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });
  try {
    const logs = await readJson('batch-adjustments.json', [] as any[]);
    return NextResponse.json({ success: true, logs });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

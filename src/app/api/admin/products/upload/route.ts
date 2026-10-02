import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { isAdmin } from '@/lib/auth';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

function sanitizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export async function POST(request: Request) {
  try {
    const auth = request.headers.get('authorization');
    if (!isAdmin(auth)) return NextResponse.json({ success: false, error: 'admin required' }, { status: 403 });

    const form = await request.formData();
    const slugRaw = form.get('slug') as string | null;
    const file = form.get('file') as File | null;
    const slug = slugRaw ? sanitizeSlug(slugRaw.trim()) : '';
    if (!slug || !file) {
      return NextResponse.json({ success: false, error: 'Missing slug or file' }, { status: 400 });
    }

    if (!allowedMimeTypes.has(file.type)) {
      return NextResponse.json({ success: false, error: 'Unsupported file type' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ success: false, error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    await fs.mkdir(imagesDir, { recursive: true });
    const filename = `${slug}.jpg`;
    const dest = path.join(imagesDir, filename);
    await fs.writeFile(dest, buffer);

    return NextResponse.json({ success: true, path: `/images/${filename}` });
  } catch {
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}

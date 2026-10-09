import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { adminError, requireAdmin } from '@/lib/admin';
import { UPLOAD_DIR } from '@/lib/uploads';

export const runtime = 'nodejs';
const EXT: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

export async function POST(r: Request) {
  try {
    await requireAdmin();
    const file = (await r.formData()).get('file');
    if (!(file instanceof File)) throw new Error('Choose an image');
    const ext = EXT[file.type];
    if (!ext) throw new Error('Use a JPG, PNG or WebP image');
    if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB');
    const buf = Buffer.from(await file.arrayBuffer());
    // Basic magic-byte check so renamed non-image files are rejected.
    const sig = buf.subarray(0, 12).toString('hex');
    const looksOk = sig.startsWith('ffd8ff') || sig.startsWith('89504e47') || (sig.startsWith('52494646') && buf.subarray(8, 12).toString() === 'WEBP');
    if (!looksOk) throw new Error('That file does not look like a valid image');
    const name = Date.now().toString(36) + '-' + crypto.randomBytes(5).toString('hex') + ext;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
    return Response.json({ url: '/uploads/' + name });
  } catch (e) {
    return adminError(e);
  }
}

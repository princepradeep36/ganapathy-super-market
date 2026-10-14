import { db } from '@/lib/db';
import { clientIp, rateLimit } from '@/lib/ratelimit';
import { requestInput } from '@/lib/validation';
import { queueMail, sendProductRequest } from '@/lib/email';

/** A customer asks the store to stock a product. */
export async function POST(req: Request) {
  if (!rateLimit('request:' + clientIp(req), 5, 60 * 60_000)) return Response.json({ error: 'Too many requests. Please call the store.' }, { status: 429 });
  try {
    const data = requestInput(await req.json());
    const saved = await db.productRequest.create({ data });
    queueMail(() => sendProductRequest(saved));
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.issues?.[0]?.message || e?.message || 'Could not send your request' }, { status: 400 });
  }
}

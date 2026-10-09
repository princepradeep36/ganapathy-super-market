// Minimal in-memory rate limiter — enough for a single small server, no Redis needed.
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  h.n++;
  return h.n <= max;
}
export function clientIp(r: Request) {
  return r.headers.get('x-forwarded-for')?.split(',')[0].trim() || r.headers.get('x-real-ip') || 'local';
}

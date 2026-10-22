import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { searchWhere } from '@/lib/catalog';
import { activeSalePrice } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Search-as-you-type suggestions for the header search box: up to 8 products, best matches first. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ items: [], total: 0 });
  const where = { active: true, ...searchWhere(q) };
  const [found, total] = await Promise.all([
    db.product.findMany({ where, include: { category: true }, orderBy: [{ featured: 'desc' }, { name: 'asc' }], take: 60 }),
    db.product.count({ where }),
  ]);
  const lq = q.toLowerCase();
  const wordStart = new RegExp('(^|[^a-z0-9])' + escape(lq));
  // Names starting with the text come first, then a word starting with it, then names containing it, then category/description matches.
  const rank = (name: string) => {
    const n = name.toLowerCase();
    return n.startsWith(lq) ? 0 : wordStart.test(n) ? 1 : n.includes(lq) ? 2 : 3;
  };
  const now = new Date();
  const items = found
    .map((p) => ({ p, r: rank(p.name) }))
    .sort((a, b) => a.r - b.r || Number(b.p.stock > 0) - Number(a.p.stock > 0))
    .slice(0, 8)
    .map(({ p }) => {
      const sale = activeSalePrice(p, now);
      return { slug: p.slug, name: p.name, unit: p.unit, image: p.image, price: sale ?? p.price, regularPrice: p.price, stock: p.stock, category: p.category.name };
    });
  return NextResponse.json({ items, total }, { headers: { 'cache-control': 'no-store' } });
}

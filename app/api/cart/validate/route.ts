import { db } from '@/lib/db';
import { activeSalePrice } from '@/lib/pricing';

/** Returns current price and stock for basket items so the checkout never shows stale data. */
export async function POST(req: Request) {
  const d = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(d.ids) ? d.ids.map(String).slice(0, 100) : [];
  const now = new Date();
  const products = await db.product.findMany({ where: { id: { in: ids }, active: true } });
  return Response.json({
    products: products.map((p) => ({ id: p.id, name: p.name, slug: p.slug, unit: p.unit, image: p.image, price: activeSalePrice(p, now) ?? p.price, regularPrice: p.price, stock: p.stock })),
  });
}

import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { siteUrl } from '@/lib/config';
import { liveCollection } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

/** Every public page, so search engines find all products, categories and collections. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories, collections] = await Promise.all([
    db.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ select: { slug: true } }),
    db.collection.findMany({ where: liveCollection(new Date()), select: { slug: true } }),
  ]);
  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/shop?offers=1`, changeFrequency: 'daily', priority: 0.8 },
    ...categories.map((c) => ({ url: `${base}/shop?cat=${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...collections.map((c) => ({ url: `${base}/shop?col=${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.6 })),
    { url: `${base}/request`, changeFrequency: 'monthly', priority: 0.3 },
  ];
}

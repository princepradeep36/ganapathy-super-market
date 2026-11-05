import Link from 'next/link';
import type { T } from '@/lib/i18n';

/** A brand on the home page or the brands page: one of its product photos, its name and item count. */
export default function BrandTile({ b, t }: { b: { name: string; slug: string; count: number; image: string | null }; t: T }) {
  return (
    <Link href={`/shop?brand=${b.slug}`} className="brandTile">
      <span className="brandPic" aria-hidden>{b.image ? <img src={b.image} alt="" loading="lazy" /> : <span className="brandInitial">{b.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()}</span>}</span>
      <b>{b.name}</b>
      <small>{t(b.count === 1 ? '{n} item' : '{n} items', { n: b.count })}</small>
    </Link>
  );
}

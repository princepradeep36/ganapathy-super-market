import Link from 'next/link';
import type { T } from '@/lib/i18n';

/** Dark "Our brands" band with brand logos sliding past; each logo opens that brand's products. */
export default function BrandStrip({ brands, t }: { brands: { name: string; slug: string; logo: string }[]; t: T }) {
  if (brands.length < 4) return null;
  // The list is shown twice so the slide loops without a gap; the copy is hidden from screen readers.
  const row = (copy: boolean) =>
    brands.map((b) => (
      <Link key={(copy ? 'c-' : '') + b.slug} href={`/shop?brand=${b.slug}`} className="brandLogo" title={b.name} aria-hidden={copy || undefined} tabIndex={copy ? -1 : undefined}>
        <img src={b.logo} alt={copy ? '' : b.name} loading="lazy" />
      </Link>
    ));
  return (
    <section className="brandStrip" aria-label={t('Our brands')}>
      <div className="wrap brandStripHead">
        <h2>{t('Our brands')}</h2>
        <Link href="/brands" className="seeAll light">{t('All brands →')}</Link>
      </div>
      <div className="brandMarquee">
        <div className="brandTrack" style={{ ['--n' as any]: brands.length }}>{row(false)}{row(true)}</div>
      </div>
    </section>
  );
}

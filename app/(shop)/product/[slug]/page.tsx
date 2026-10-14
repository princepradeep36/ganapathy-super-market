import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { sek } from '@/lib/money';
import { store } from '@/lib/config';
import { activeSalePrice, discountPercent } from '@/lib/pricing';
import ProductCard, { cartItemOf } from '@/components/shop/ProductCard';
import ProductImage from '@/components/shop/ProductImage';
import QtyButton from '@/components/shop/QtyButton';
import { getT } from '@/lib/i18n-server';
import { categoryName } from '@/lib/i18n';

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const p = await db.product.findUnique({ where: { slug } });
  return p ? { title: p.name, description: p.description } : {};
}

export default async function ProductPage({ params }: P) {
  const { slug } = await params;
  const p = await db.product.findUnique({ where: { slug }, include: { category: { include: { parent: true } } } });
  if (!p || !p.active) notFound();
  const { lang, t } = await getT();
  const cat = categoryName(lang, p.category);
  const now = new Date();
  const sale = activeSalePrice(p, now);
  const related = await db.product.findMany({
    where: { active: true, categoryId: p.categoryId, id: { not: p.id } },
    include: { category: true },
    take: 5,
  });
  return (
    <main className="wrap section">
      <nav className="crumbs">
        <Link href="/">{t('Home')}</Link> /{' '}
        {p.category.parent && <><Link href={`/shop?cat=${p.category.parent.slug}`}>{categoryName(lang, p.category.parent)}</Link> / </>}
        <Link href={`/shop?cat=${p.category.slug}`}>{cat}</Link> / {p.name}
      </nav>
      <div className="pdp">
        <div className="pdpPic">
          {sale && <span className="badge badge-offer">{t('{n}% OFF', { n: discountPercent(p.price, sale) })}</span>}
          <ProductImage image={p.image} name={p.name} size="lg" />
        </div>
        <div className="pdpInfo">
          <Link href={`/shop?cat=${p.category.slug}`} className="pcardCat">{cat}</Link>
          <h1>{p.name}</h1>
          {p.unit && <p className="pdpUnit">{p.unit}</p>}
          <div className="pdpPrice">
            <strong>{sek(sale ?? p.price)}</strong>
            {sale && <><s>{sek(p.price)}</s><span className="savePill">{t('You save {amount}', { amount: sek(p.price - sale) })}</span></>}
          </div>
          {sale && p.saleEnd && <p className="muted">{t('Offer valid until {date}', { date: p.saleEnd.toLocaleDateString('sv-SE') })}</p>}
          <div className="pdpBuy">
            <QtyButton item={cartItemOf(p, now)} size="lg" />
            <span className={p.stock > 5 ? 'stockOk' : p.stock > 0 ? 'stockLow' : 'stockOut'}>
              {p.stock > 5 ? t('● In stock') : p.stock > 0 ? t('● Only {n} left', { n: p.stock }) : t('● Out of stock')}
            </span>
          </div>
          {p.description && <div className="pdpDesc"><h3>{t('About this product')}</h3><p>{p.description}</p></div>}
          <ul className="pdpPerks">
            <li>{t('🏪 Free pickup at {address}', { address: store.address })}</li>
            <li>{t('🚚 Home delivery within {area} — free over {amount}', { area: store.deliveryArea, amount: sek(store.freeDeliveryMin) })}</li>
            <li>{t('💳 Pay at pickup or on delivery')}</li>
          </ul>
        </div>
      </div>
      {related.length > 0 && (
        <section className="section sectionTight">
          <div className="sectionHead"><h2>{t('More from {category}', { category: cat })}</h2></div>
          <div className="rail">{related.map((r) => <ProductCard key={r.id} p={r} now={now} />)}</div>
        </section>
      )}
    </main>
  );
}

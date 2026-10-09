import Link from 'next/link';
import { sek } from '@/lib/money';
import { activeSalePrice, discountPercent } from '@/lib/pricing';
import ProductImage from './ProductImage';
import QtyButton from './QtyButton';
import { getT } from '@/lib/i18n-server';
import { categoryName } from '@/lib/i18n';

export type CardProduct = {
  id: string; name: string; slug: string; unit: string | null; description: string;
  price: number; salePrice: number | null; saleStart: Date | null; saleEnd: Date | null;
  stock: number; image: string; category: { name: string; slug: string };
};

export function cartItemOf(p: CardProduct, now = new Date()) {
  const sale = activeSalePrice(p, now);
  return { id: p.id, name: p.name, slug: p.slug, unit: p.unit, price: sale ?? p.price, regularPrice: p.price, image: p.image, stock: p.stock };
}

export default async function ProductCard({ p, now = new Date() }: { p: CardProduct; now?: Date }) {
  const { lang, t } = await getT();
  const sale = activeSalePrice(p, now);
  const low = p.stock > 0 && p.stock <= 5;
  return (
    <article className={`pcard${p.stock <= 0 ? ' soldout' : ''}`}>
      <Link href={`/product/${p.slug}`} className="pcardPic" aria-label={p.name}>
        {sale && <span className="badge badge-offer">{t('{n}% OFF', { n: discountPercent(p.price, sale) })}</span>}
        <ProductImage image={p.image} name={p.name} />
      </Link>
      <div className="pcardBody">
        <span className="pcardCat">{categoryName(lang, p.category)}</span>
        <Link href={`/product/${p.slug}`} className="pcardName">{p.name}</Link>
        <span className="pcardUnit">{p.unit || ' '}</span>
        <div className="pcardFoot">
          <div className="price">
            <strong>{sek(sale ?? p.price)}</strong>
            {sale && <s>{sek(p.price)}</s>}
          </div>
          <QtyButton item={cartItemOf(p, now)} />
        </div>
        {low && <span className="lowStock">{t('Only {n} left', { n: p.stock })}</span>}
      </div>
    </article>
  );
}

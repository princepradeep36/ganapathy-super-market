import Link from 'next/link';
import { db } from '@/lib/db';
import { store } from '@/lib/config';
import { sek } from '@/lib/money';
import { activeSalePrice, discountPercent } from '@/lib/pricing';
import ProductCard, { type CardProduct } from '@/components/shop/ProductCard';
import ProductImage from '@/components/shop/ProductImage';
import HeroCarousel from '@/components/shop/HeroCarousel';
import WhatsAppIcon from '@/components/shop/WhatsAppIcon';
import { getT } from '@/lib/i18n-server';
import { categoryName, type T } from '@/lib/i18n';
import { categoryTree, liveBanner, liveCollection } from '@/lib/catalog';

export default async function Home() {
  const now = new Date();
  const { lang, t } = await getT();
  const [products, cats, collections, banners, coupon, sold] = await Promise.all([
    db.product.findMany({ where: { active: true }, include: { category: true }, orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }] }),
    db.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: { where: { active: true } } } } },
    }),
    db.collection.findMany({
      where: liveCollection(now),
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { products: { where: { active: true, stock: { gt: 0 } }, include: { category: true }, orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }], take: 10 } },
    }),
    db.banner.findMany({ where: liveBanner(now), orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }),
    db.coupon.findFirst({
      where: { active: true, OR: [{ endsAt: null }, { endsAt: { gt: now } }], AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }] },
      orderBy: { createdAt: 'desc' },
    }),
    db.orderItem.groupBy({
      by: ['productId'],
      where: { order: { status: { not: 'CANCELLED' } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 20,
    }),
  ]);
  const categories = categoryTree(cats).map((c) => ({ ...c, total: c._count.products + c.children.reduce((a, s) => a + s._count.products, 0) }));
  const offers = products.filter((p) => p.stock > 0 && activeSalePrice(p, now) != null);
  const popular = products.filter((p) => p.stock > 0).slice(0, 10);
  // Best sellers by quantity ordered, topped up with popular items when there are few orders yet.
  const inStock = new Map(products.filter((p) => p.stock > 0).map((p) => [p.id, p]));
  const bestSellers = sold.map((s) => inStock.get(s.productId)).filter((p): p is (typeof products)[number] => !!p);
  for (const p of popular) if (bestSellers.length < 4 && !bestSellers.includes(p)) bestSellers.push(p);
  const slideOffers = offers.slice(0, 4);
  const slideBest = bestSellers.slice(0, 4);

  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <HeroCarousel labels={[t('Welcome'), ...banners.map((b) => b.title), ...(slideOffers.length ? [t('Offers')] : []), ...(slideBest.length ? [t('Popular items')] : []), t('Join our WhatsApp group')]}>
            <Link href="/shop" className="banner" aria-label={t('{name} — shop now', { name: store.name })}>
              <picture>
                <source media="(max-width: 720px)" srcSet="/brand/banner-sm.jpg" />
                <img src="/brand/banner.jpg" width={1774} height={887} alt={t('{name} — Freshness, Quality, For Your Family', { name: store.name })} fetchPriority="high" />
              </picture>
            </Link>
            {banners.map((b) => {
              // FILL covers the slide (cropping to the chosen focus); WHOLE shows the entire poster on a blurred copy of itself.
              const img = (
                <>
                  <span className="bannerBlur" style={{ backgroundImage: `url(${b.image})` }} aria-hidden />
                  <img src={b.image} alt={b.title} loading="lazy" />
                </>
              );
              const cls = `banner bannerFit${b.fit === 'WHOLE' ? '' : ' bannerCover'}`;
              const style = { ['--focus' as any]: b.focus };
              if (!b.link) return <div key={b.id} className={cls} style={style}>{img}</div>;
              return b.link.startsWith('/')
                ? <Link key={b.id} href={b.link} className={cls} style={style}>{img}</Link>
                : <a key={b.id} href={b.link} className={cls} style={style} target="_blank" rel="noreferrer">{img}</a>;
            })}
            {slideOffers.length > 0 && (
              <SlidePanel eyebrow={t('Limited time')} title={t('Today’s offers')} href="/shop?offers=1" cta={t('All offers')} items={slideOffers} now={now} t={t} />
            )}
            {slideBest.length > 0 && (
              <SlidePanel eyebrow={t('Customer favourites')} title={t('Popular items')} href="/shop" cta={t('Shop all')} items={slideBest} now={now} t={t} alt />
            )}
            <div className="slidePanel slideWa">
              <div className="slidePanelHead">
                <span className="slideEyebrow">{t('Weekly offers on WhatsApp')}</span>
                <h2>{t('Join our WhatsApp group')}</h2>
                <p className="slideWaText">{t('Be the first to hear about weekly offers, fresh stock arrivals and festival specials.')}</p>
                <a className="slideCta slideWaBtn" href={store.whatsappGroup} target="_blank" rel="noreferrer"><WhatsAppIcon /> {t('Join the group')}</a>
              </div>
              <a className="slideWaQr" href={store.whatsappGroup} target="_blank" rel="noreferrer" aria-label={t('WhatsApp group QR code')}>
                <img src="/brand/whatsapp-qr.svg" width={220} height={220} alt={t('QR code to join our WhatsApp group')} />
                <span>{t('Scan with your phone camera')}</span>
              </a>
            </div>
          </HeroCarousel>
          <div className="heroBar">
            <div className="heroSearchBox">
              <h1>{t('What are you cooking today?')}</h1>
              <form className="heroSearch" action="/shop" role="search">
                <input name="q" type="search" placeholder={t('Search rice, atta, dal, paneer, masala…')} aria-label={t('Search products')} />
                <button className="btn">{t('Search')}</button>
              </form>
              <ul className="heroTrust">
                <li><span aria-hidden>🏪</span><b>{t('Free')}</b> {t('store pickup')}</li>
                <li><span aria-hidden>🚚</span><b>{t('Free delivery')}</b> {t('in {area} over {amount}', { area: store.deliveryArea, amount: sek(store.freeDeliveryMin) })}</li>
                <li><span aria-hidden>💳</span><b>{t('Pay')}</b> {t('at pickup')}</li>
              </ul>
            </div>
            {coupon ? (
              <div className="promo promo-main">
                <span className="promoTag">{coupon.name}</span>
                <strong>{coupon.type === 'PERCENT' ? t('{n}% off', { n: coupon.value }) : t('{amount} off', { amount: sek(coupon.value) })}</strong>
                <p>{coupon.minOrder > 0 ? t('on orders over {amount}', { amount: sek(coupon.minOrder) }) : t('on your whole basket')}{coupon.maxDiscount ? t(' · up to {amount}', { amount: sek(coupon.maxDiscount) }) : ''}</p>
                <span className="code">{t('Use code')} <b>{coupon.code}</b></span>
              </div>
            ) : (
              <Link href="/shop?cat=fresh-vegetables" className="promo promo-main">
                <span className="promoTag">{t('This week')}</span>
                <strong>{t('Fresh vegetables')}</strong>
                <p>{t('New stock every week — brinjal, okra, curry leaves.')}</p>
              </Link>
            )}
            <Link href="/shop?offers=1" className="promo promo-alt">
              <span className="promoEmoji" aria-hidden>🏷️</span>
              <b>{t('{n} items on offer', { n: offers.length })}</b>
              <small>{t('Shop today’s deals →')}</small>
            </Link>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="sectionHead">
          <h2>{t('Shop by category')}</h2>
          <Link href="/shop" className="seeAll">{t('See all →')}</Link>
        </div>
        <div className="catGrid">
          {categories.filter((c) => c.total > 0).map((c) => (
            <Link key={c.id} href={`/shop?cat=${c.slug}`} className="catTile">
              <span className="catIcon" aria-hidden>{c.icon}</span>
              <b>{categoryName(lang, c)}</b>
              <small>{t(c.total === 1 ? '{n} item' : '{n} items', { n: c.total })}</small>
            </Link>
          ))}
        </div>
      </section>

      {collections.filter((c) => c.products.length > 0).map((c) => (
        <section className="wrap section collSection" key={c.id}>
          <div className="sectionHead">
            <div>
              <span className="eyebrow">{t('Festival special')}</span>
              <h2>{c.icon} {c.name}</h2>
              {c.description && <p className="muted">{c.description}</p>}
            </div>
            <Link href={`/shop?col=${c.slug}`} className="seeAll">{t('See all →')}</Link>
          </div>
          <div className="rail">{c.products.map((p) => <ProductCard key={p.id} p={p} now={now} />)}</div>
        </section>
      ))}

      {offers.length > 0 && (
        <section className="offersBand">
          <div className="wrap section">
            <div className="sectionHead">
              <div><span className="eyebrow light">{t('Limited time')}</span><h2>{t('Today’s offers')}</h2></div>
              <Link href="/shop?offers=1" className="seeAll light">{t('All offers →')}</Link>
            </div>
            <div className="rail">{offers.slice(0, 10).map((p) => <ProductCard key={p.id} p={p} now={now} />)}</div>
          </div>
        </section>
      )}

      <section className="wrap section">
        <div className="sectionHead">
          <h2>{t('Popular right now')}</h2>
          <Link href="/shop" className="seeAll">{t('Browse all →')}</Link>
        </div>
        <div className="pgrid">{popular.map((p) => <ProductCard key={p.id} p={p} now={now} />)}</div>
      </section>

      <section className="wrap section">
        <div className="howGrid">
          <div><span aria-hidden>🛒</span><b>{t('1. Fill your basket')}</b><p>{t('Browse by category or search — offers are applied automatically.')}</p></div>
          <div><span aria-hidden>📅</span><b>{t('2. Pick up or delivery')}</b><p>{t('Choose free store pickup, or a home-delivery time slot.')}</p></div>
          <div><span aria-hidden>✅</span><b>{t('3. Pay when you get it')}</b><p>{t('Pay at pickup or on delivery. We’ll confirm your order quickly.')}</p></div>
        </div>
      </section>
    </main>
  );
}

function SlidePanel({ eyebrow, title, href, cta, items, now, t, alt = false }: { eyebrow: string; title: string; href: string; cta: string; items: CardProduct[]; now: Date; t: T; alt?: boolean }) {
  return (
    <div className={`slidePanel${alt ? ' slidePanelAlt' : ''}`}>
      <div className="slidePanelHead">
        <span className="slideEyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <Link href={href} className="slideCta">{cta} →</Link>
      </div>
      <div className="slideItems">
        {items.map((p) => {
          const sale = activeSalePrice(p, now);
          return (
            <Link key={p.id} href={`/product/${p.slug}`} className="slideItem">
              {sale && <span className="slideBadge">{t('{n}% OFF', { n: discountPercent(p.price, sale) })}</span>}
              <ProductImage image={p.image} name={p.name} />
              <b>{p.name}</b>
              <span className="slidePrice"><strong>{sek(sale ?? p.price)}</strong>{sale && <s>{sek(p.price)}</s>}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

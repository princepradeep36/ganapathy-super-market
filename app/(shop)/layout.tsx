import Link from 'next/link';
import { db } from '@/lib/db';
import { mapEmbed, publicStore, store, telHref } from '@/lib/config';
import Logo from '@/components/Logo';
import { sek } from '@/lib/money';
import { CartButton, CartDrawer, MobileCartBar, MobileNav, Toaster } from '@/components/shop/CartUI';
import { LangProvider, LangSwitch } from '@/components/shop/I18n';
import { getT } from '@/lib/i18n-server';
import { categoryName } from '@/lib/i18n';
import WhatsAppIcon from '@/components/shop/WhatsAppIcon';
import { liveCollection } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [categories, collections] = await Promise.all([
    db.category.findMany({
      where: { parentId: null, OR: [{ products: { some: { active: true } } }, { children: { some: { products: { some: { active: true } } } } }] },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
    db.collection.findMany({
      where: { ...liveCollection(new Date()), products: { some: { active: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
  ]);
  const cfg = publicStore();
  const { lang, t } = await getT();
  return (
    <LangProvider lang={lang}>
      <div className="topbar">
        <div className="wrap topbarIn">
          <span>{t('🚚 Home delivery in {area} · free over {amount} · 🏪 Free store pickup', { area: store.deliveryArea, amount: sek(cfg.freeDeliveryMin) })}</span>
          <span className="topbarRight">
            <span className="hideSm">🕘 {t(store.hours)} · 📞 <a href={telHref()}>{store.phone}</a> · 📍 <a href={store.mapUrl} target="_blank" rel="noreferrer">{store.address}</a></span>
            <LangSwitch />
          </span>
        </div>
      </div>
      <header className="header">
        <div className="wrap headerIn">
          <Link className="logo" href="/" aria-label={t('{name} home', { name: store.name })}>
            <Logo />
          </Link>
          <form className="search" action="/shop" role="search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input name="q" type="search" placeholder={t('Search for atta, dal, paneer, masala…')} aria-label={t('Search products')} autoComplete="off" />
          </form>
          <Link href="/orders" className="headerLink hideSm">{t('My orders')}</Link>
          <CartButton />
        </div>
        <nav className="catbar" aria-label={t('Categories')}>
          <div className="wrap catbarIn">
            <Link href="/shop">{t('All')}</Link>
            <Link href="/shop?offers=1" className="hot">{t('🏷️ Offers')}</Link>
            {collections.map((c) => (
              <Link key={c.id} href={`/shop?col=${c.slug}`} className="hot">{c.icon} {c.name}</Link>
            ))}
            {categories.map((c) => (
              <Link key={c.id} href={`/shop?cat=${c.slug}`}>{categoryName(lang, c)}</Link>
            ))}
          </div>
        </nav>
      </header>
      <div className="page">{children}</div>
      <section className="waJoin" aria-labelledby="waJoinTitle">
        <div className="wrap">
        <div className="waJoinIn">
          <div className="waJoinText">
            <span className="waIcon" aria-hidden><WhatsAppIcon /></span>
            <div>
              <h2 id="waJoinTitle">{t('Join our WhatsApp group')}</h2>
              <p>{t('Be the first to hear about weekly offers, fresh stock arrivals and festival specials.')}</p>
              <a className="btn waBtn" href={store.whatsappGroup} target="_blank" rel="noreferrer"><WhatsAppIcon /> {t('Join the group')}</a>
            </div>
          </div>
          <a className="waQr" href={store.whatsappGroup} target="_blank" rel="noreferrer" aria-label={t('WhatsApp group QR code')}>
            <img src="/brand/whatsapp-qr.svg" width={150} height={150} alt={t('QR code to join our WhatsApp group')} />
            <span>{t('Scan with your phone camera')}</span>
          </a>
        </div>
        </div>
      </section>
      <section className="visit">
        <div className="wrap visitGrid">
          <div className="visitInfo">
            <span className="eyebrow">{t('Visit our store')}</span>
            <h2>{store.name}</h2>
            <ul>
              <li><span aria-hidden>📍</span><div><b>{t('Address')}</b><a href={store.mapUrl} target="_blank" rel="noreferrer">{store.address}</a></div></li>
              <li><span aria-hidden>🕘</span><div><b>{t('Opening hours')}</b>{t(store.hours)}</div></li>
              <li><span aria-hidden>📞</span><div><b>{t('Phone')}</b><a href={telHref()}>{store.phone}</a></div></li>
            </ul>
            <div className="visitBtns">
              <a className="btn" href={store.mapUrl} target="_blank" rel="noreferrer">{t('Get directions')}</a>
              <a className="btn btn-ghost" href={telHref()}>{t('Call the store')}</a>
            </div>
          </div>
          <iframe className="visitMap" src={mapEmbed()} title={t('Map: {address}', { address: store.address })} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
      </section>
      <footer className="footer">
        <div className="wrap footerGrid">
          <div>
            <Logo light size={64} />
            <p>{t('Authentic Indian groceries for everyday kitchens in Sweden — from Ponni rice to fresh curry leaves.')}</p>
          </div>
          <div>
            <h4>{t('Shop')}</h4>
            <Link href="/shop">{t('All products')}</Link>
            <Link href="/shop?offers=1">{t('Offers')}</Link>
            {categories.slice(0, 4).map((c) => <Link key={c.id} href={`/shop?cat=${c.slug}`}>{categoryName(lang, c)}</Link>)}
          </div>
          <div>
            <h4>{t('Help')}</h4>
            <Link href="/orders">{t('Track my order')}</Link>
            <Link href="/request">{t('Request a product')}</Link>
            <span>{t('Pickup is always free')}</span>
            <span>{t('Pay at pickup / on delivery')}{cfg.swish ? ' · Swish' : ''}</span>
          </div>
          <div>
            <h4>{t('Visit us')}</h4>
            <a href={store.mapUrl} target="_blank" rel="noreferrer">📍 {store.address}</a>
            <span>🕘 {t(store.hours)}</span>
            <a href={telHref()}>📞 {store.phone}</a>
            {store.email && <a href={`mailto:${store.email}`}>✉️ {store.email}</a>}
            <a href={store.whatsappGroup} target="_blank" rel="noreferrer">{t('💬 Join our WhatsApp group')}</a>
            <a href={store.mapUrl} target="_blank" rel="noreferrer" className="footerMapBtn">{t('Get directions →')}</a>
          </div>
        </div>
        <div className="wrap footerBase">
          <span>© {new Date().getFullYear()} {store.legalName}</span>
          <span>{t('Organisationsnummer: {n}', { n: store.orgNumber })}</span>
        </div>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'GroceryStore', name: store.name, telephone: telHref().slice(4), hasMap: store.mapUrl,
          address: { '@type': 'PostalAddress', streetAddress: store.address.split(',')[0], postalCode: '252 18', addressLocality: 'Helsingborg', addressCountry: 'SE' },
          openingHours: 'Mo-Su 09:00-20:30',
        }) }}
      />
      <MobileCartBar />
      <MobileNav />
      <CartDrawer cfg={cfg} />
      <Toaster />
    </LangProvider>
  );
}

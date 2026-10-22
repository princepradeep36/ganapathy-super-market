import Link from 'next/link';
import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { activeSalePrice, effectivePrice } from '@/lib/pricing';
import ProductCard from '@/components/shop/ProductCard';
import { getT } from '@/lib/i18n-server';
import { categoryName } from '@/lib/i18n';
import { categoryTree, inCategory, liveCollection, searchWhere } from '@/lib/catalog';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('Shop') };
}

type SP = { q?: string; cat?: string; col?: string; sort?: string; offers?: string; instock?: string };
const SORTS: [string, string][] = [['', 'Popular'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low'], ['discount', 'Biggest discount'], ['name', 'A–Z']];

export default async function Shop({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { lang, t } = await getT();
  const q = (sp.q || '').trim().slice(0, 60);
  const now = new Date();
  const and: Prisma.ProductWhereInput[] = [];
  if (sp.cat) and.push(inCategory(sp.cat));
  if (sp.col) and.push({ collections: { some: { slug: sp.col, ...liveCollection(now) } } });
  if (q) and.push(searchWhere(q));
  const where: Prisma.ProductWhereInput = { active: true, AND: and };
  const [cats, all, collection] = await Promise.all([
    db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { _count: { select: { products: { where: { active: true } } } } } }),
    db.product.findMany({
      where,
      include: { category: true },
      orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }],
    }),
    sp.col ? db.collection.findFirst({ where: { slug: sp.col, ...liveCollection(now) } }) : null,
  ]);
  // Main categories with their sub-categories; counts include the sub-categories' products.
  const categories = categoryTree(cats)
    .map((c) => ({ ...c, children: c.children.filter((s) => s._count.products > 0), total: c._count.products + c.children.reduce((a, s) => a + s._count.products, 0) }))
    .filter((c) => c.total > 0);
  let products = all;
  if (sp.offers) products = products.filter((p) => activeSalePrice(p, now) != null);
  if (sp.instock) products = products.filter((p) => p.stock > 0);
  const price = (p: (typeof all)[number]) => effectivePrice(p, now);
  const disc = (p: (typeof all)[number]) => p.price - price(p);
  if (sp.sort === 'price-asc') products = [...products].sort((a, b) => price(a) - price(b));
  if (sp.sort === 'price-desc') products = [...products].sort((a, b) => price(b) - price(a));
  if (sp.sort === 'discount') products = [...products].sort((a, b) => disc(b) - disc(a));
  if (sp.sort === 'name') products = [...products].sort((a, b) => a.name.localeCompare(b.name));
  // Sold-out items always go last so customers see what they can buy first.
  products = [...products].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));

  const current = cats.find((c) => c.slug === sp.cat);
  const currentName = current ? categoryName(lang, current) : '';
  // The open main category: the chosen one, or the parent of a chosen sub-category.
  const openMain = categories.find((c) => c.slug === sp.cat || c.children.some((s) => s.slug === sp.cat));
  const href = (patch: Partial<SP>) => {
    const u = new URLSearchParams();
    const merged = { ...sp, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) u.set(k, String(v));
    const s = u.toString();
    return '/shop' + (s ? '?' + s : '');
  };
  const title = q ? t('Results for “{q}”', { q }) : collection ? `${collection.icon} ${collection.name}` : sp.offers ? t('Offers & deals') : current ? currentName : t('All products');

  return (
    <main className="wrap shopPage">
      <aside className="filters" aria-label={t('Filters')}>
        <h3>{t('Categories')}</h3>
        <Link href={href({ cat: undefined })} className={!sp.cat ? 'on' : ''}><span>🛒</span>{t('All products')}</Link>
        {categories.map((c) => (
          <div key={c.id}>
            <Link href={href({ cat: c.slug })} className={sp.cat === c.slug ? 'on' : ''}>
              <span aria-hidden>{c.icon}</span>{categoryName(lang, c)}<small>{c.total}</small>
            </Link>
            {openMain?.id === c.id && c.children.length > 0 && (
              <div className="subFilters">
                {c.children.map((s) => (
                  <Link key={s.id} href={href({ cat: s.slug })} className={sp.cat === s.slug ? 'on' : ''}>{categoryName(lang, s)}<small>{s._count.products}</small></Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </aside>
      <section className="results">
        <div className="resultsHead">
          <div>
            <nav className="crumbs">
              <Link href="/">{t('Home')}</Link> / <Link href="/shop">{t('Shop')}</Link>
              {openMain && openMain.slug !== sp.cat && <> / <Link href={href({ cat: openMain.slug })}>{categoryName(lang, openMain)}</Link></>}
              {current && <> / {currentName}</>}
            </nav>
            <h1>{title}</h1>
            {collection?.description && <p className="collIntro">{collection.description}</p>}
            <p className="muted">{t(products.length === 1 ? '{n} product' : '{n} products', { n: products.length })}</p>
          </div>
        </div>
        <div className="chipRow catChipsMobile">
          <Link href={href({ cat: undefined })} className={`chip${!sp.cat ? ' on' : ''}`}>{t('All')}</Link>
          {categories.map((c) => (
            <Link key={c.id} href={href({ cat: c.slug })} className={`chip${openMain?.id === c.id ? ' on' : ''}`}>{c.icon} {categoryName(lang, c)}</Link>
          ))}
        </div>
        {openMain && openMain.children.length > 0 && (
          <div className="chipRow subChips">
            <Link href={href({ cat: openMain.slug })} className={`chip chip-ghost${sp.cat === openMain.slug ? ' on' : ''}`}>{t('All {category}', { category: categoryName(lang, openMain) })}</Link>
            {openMain.children.map((s) => (
              <Link key={s.id} href={href({ cat: s.slug })} className={`chip chip-ghost${sp.cat === s.slug ? ' on' : ''}`}>{categoryName(lang, s)}</Link>
            ))}
          </div>
        )}
        <div className="chipRow">
          <Link href={href({ offers: sp.offers ? undefined : '1' })} className={`chip${sp.offers ? ' on' : ''}`}>{t('🏷️ On offer')}</Link>
          <Link href={href({ instock: sp.instock ? undefined : '1' })} className={`chip${sp.instock ? ' on' : ''}`}>{t('In stock')}</Link>
          <span className="chipSep" />
          {SORTS.map(([k, label]) => (
            <Link key={k} href={href({ sort: k || undefined })} className={`chip chip-ghost${(sp.sort || '') === k ? ' on' : ''}`}>{t(label)}</Link>
          ))}
        </div>
        {q && <p className="muted searchNote">{t('Showing matches for')} <b>{q}</b>. <Link href={href({ q: undefined })}>{t('Clear search')}</Link></p>}
        {products.length ? (
          <>
            <div className="pgrid">{products.map((p) => <ProductCard key={p.id} p={p} now={now} />)}</div>
            <p className="requestNudge">{t('Can’t find what you need?')} <Link href="/request">{t('Ask us to stock it →')}</Link></p>
          </>
        ) : (
          <div className="emptyState">
            <span aria-hidden>🔍</span>
            <h2>{t('No products found')}</h2>
            <p>{t('Try another word, or browse all categories. Can’t find something? Call us — we can often order it in.')}</p>
            <div className="emptyBtns">
              <Link className="btn" href={q ? `/request?product=${encodeURIComponent(q)}` : '/request'}>{t('Request this product')}</Link>
              <Link className="btn btn-ghost" href="/shop">{t('Browse all products')}</Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

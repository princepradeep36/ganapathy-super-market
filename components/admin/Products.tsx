'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { activeSalePrice } from '@/lib/pricing';
import { categoryTree } from '@/lib/catalog';
import ProductImage from '@/components/shop/ProductImage';
import { Modal, api, fromInputDate, kr, toInputDate, toast } from './ui';

/** "Rice › 5 kg" for sub-categories, plain name otherwise. */
const catLabel = (c: any) => (c?.parent ? `${c.parent.name} › ${c.name}` : c?.name);

const EMOJI = ['🍚', '🌾', '🫘', '🌶️', '🧄', '🧅', '🥬', '🍆', '🥭', '🍌', '🥥', '🧀', '🥛', '🫓', '🥨', '🍪', '☕', '🍵', '🫙', '🧂', '🛢️', '🍜', '🧊', '🛒'];

export default function Products({ products, categories, collections, lowStock }: { products: any[]; categories: any[]; collections: any[]; lowStock: number }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [view, setView] = useState('active');
  const [edit, setEdit] = useState<any | null>(null);
  const now = new Date();

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return products.filter((p) =>
      (!n || p.name.toLowerCase().includes(n)) &&
      (!cat || p.categoryId === cat || p.category?.parentId === cat) &&
      (view === 'all' || (view === 'active' && p.active) || (view === 'hidden' && !p.active) ||
        (view === 'low' && p.active && p.stock <= lowStock) || (view === 'offer' && p.active && activeSalePrice({ ...p, saleStart: p.saleStart && new Date(p.saleStart), saleEnd: p.saleEnd && new Date(p.saleEnd) }, now) != null)),
    );
  }, [products, q, cat, view, lowStock]); // eslint-disable-line

  async function patch(p: any, data: any, msg?: string) {
    try {
      await api('/api/admin/products/' + p.id, { method: 'PATCH', json: data });
      if (msg) toast(msg);
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'err');
    }
  }

  const VIEWS: [string, string][] = [['active', 'Visible'], ['low', `Low stock`], ['offer', 'On offer'], ['hidden', 'Hidden'], ['all', 'All']];
  return (
    <>
      <div className="ahead">
        <div><span className="kicker">Catalogue</span><h1>Products</h1><p className="muted">{products.filter((p) => p.active).length} visible in the shop · prices, stock, photos and offers.</p></div>
        <div className="aheadActions"><button className="btn" onClick={() => setEdit({})}>+ Add product</button></div>
      </div>
      <div className="toolbar">
        <div className="segs">{VIEWS.map(([k, l]) => <button key={k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>)}</div>
        <select className="selectIn" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categoryTree(categories).map((c) => [<option key={c.id} value={c.id}>{c.name}</option>, ...c.children.map((s: any) => <option key={s.id} value={s.id}>{'\u00a0\u00a0› '}{s.name}</option>)])}
        </select>
        <input className="searchIn" type="search" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="panel flush">
        {list.length ? (
          <div className="tableScroll">
            <table className="atable">
              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>In shop</th><th /></tr></thead>
              <tbody>
                {list.map((p) => {
                  const sale = activeSalePrice({ ...p, saleStart: p.saleStart && new Date(p.saleStart), saleEnd: p.saleEnd && new Date(p.saleEnd) }, now);
                  return (
                    <tr key={p.id} className={p.active ? '' : 'rowMuted'}>
                      <td>
                        <div className="prodCell">
                          <ProductImage image={p.image} name={p.name} size="sm" />
                          <span><b>{p.name}</b><small>{p.unit || '—'}{p.featured && ' · ⭐ Featured'}</small></span>
                        </div>
                      </td>
                      <td>{catLabel(p.category)}</td>
                      <td>
                        {sale ? <><b className="okText">{kr(sale)}</b><small><s>{kr(p.price)}</s> offer</small></> : <b>{kr(p.price)}</b>}
                        {!sale && p.salePrice && <small className="muted">offer scheduled/ended</small>}
                      </td>
                      <td>
                        <div className={`stockCtl${p.stock === 0 ? ' out' : p.stock <= lowStock ? ' low' : ''}`}>
                          <button onClick={() => patch(p, { stockDelta: -1 })} disabled={p.stock === 0} aria-label="Decrease stock">−</button>
                          <input
                            key={p.stock}
                            defaultValue={p.stock}
                            inputMode="numeric"
                            aria-label={`Stock for ${p.name}`}
                            onBlur={(e) => { const v = parseInt(e.target.value, 10); if (Number.isInteger(v) && v >= 0 && v !== p.stock) patch(p, { stock: v }, 'Stock updated'); }}
                            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                          />
                          <button onClick={() => patch(p, { stockDelta: 1 })} aria-label="Increase stock">+</button>
                        </div>
                      </td>
                      <td>
                        <button className={`switch${p.active ? ' on' : ''}`} role="switch" aria-checked={p.active} aria-label="Visible in shop" onClick={() => patch(p, { active: !p.active }, p.active ? 'Hidden from shop' : 'Visible in shop')}><span /></button>
                      </td>
                      <td className="right"><button className="linkBtn" onClick={() => setEdit(p)}>Edit</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="emptyState small"><span aria-hidden>📦</span><p>No products match.</p></div>}
      </div>
      {edit && <ProductForm product={edit} categories={categories} collections={collections} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); router.refresh(); }} />}
    </>
  );
}

function ProductForm({ product, categories, collections, onClose, onSaved }: { product: any; categories: any[]; collections: any[]; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [image, setImage] = useState<string>(product.image || '🛒');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [hasOffer, setHasOffer] = useState(product.salePrice != null);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const f = new FormData(e.currentTarget);
      let img = image;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        img = (await api<{ url: string }>('/api/admin/upload', { method: 'POST', body: fd })).url;
      }
      const body = {
        name: f.get('name'), description: f.get('description'), unit: f.get('unit'), categoryId: f.get('categoryId'),
        price: f.get('price'), stock: f.get('stock'), image: img,
        salePrice: hasOffer ? f.get('salePrice') : '', saleStart: hasOffer ? fromInputDate(f.get('saleStart')) : '', saleEnd: hasOffer ? fromInputDate(f.get('saleEnd')) : '',
        active: f.get('active') === 'on', featured: f.get('featured') === 'on',
        collectionIds: f.getAll('collectionIds'),
      };
      await api(product.id ? '/api/admin/products/' + product.id : '/api/admin/products', { method: product.id ? 'PUT' : 'POST', json: body });
      toast(product.id ? 'Product saved' : 'Product added');
      onSaved();
    } catch (x: any) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={product.id ? 'Edit product' : 'Add product'} kicker="Product" onClose={onClose} wide>
      <form onSubmit={save} className="pform">
        <div className="pformPic">
          <div className="picPreview">{preview ? <img src={preview} alt="" /> : <ProductImage image={image} name="" size="lg" />}</div>
          <label className="upload">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const x = e.target.files?.[0]; if (x) { setFile(x); setPreview(URL.createObjectURL(x)); } }} />
            📷 {file ? file.name : 'Upload photo'}
            <small>JPG, PNG or WebP · max 5 MB · square looks best</small>
          </label>
          <div className="emojiPick" aria-label="Or pick an icon">
            {EMOJI.map((em) => <button type="button" key={em} className={image === em && !file ? 'on' : ''} onClick={() => { setImage(em); setFile(null); setPreview(null); }}>{em}</button>)}
          </div>
        </div>
        <div className="formGrid">
          <label className="full">Product name<input name="name" defaultValue={product.name} required placeholder="e.g. Ponni Boiled Rice" /></label>
          <label>Category
            <select name="categoryId" defaultValue={product.categoryId || categories[0]?.id} required>
              {categoryTree(categories).map((c) => c.children.length ? (
                <optgroup key={c.id} label={`${c.icon} ${c.name}`}>
                  <option value={c.id}>{c.name} (general)</option>
                  {c.children.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              ) : <option value={c.id} key={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </label>
          <label>Pack size / unit<input name="unit" defaultValue={product.unit || ''} placeholder="5 kg · 500 g · 1 bunch" /></label>
          <label className="full">Description<textarea name="description" defaultValue={product.description} rows={3} placeholder="Short, helpful description for customers" /></label>
          <label>Regular price (kr)<input name="price" type="number" step="0.01" min="0" defaultValue={product.price != null ? product.price / 100 : ''} required /></label>
          <label>Stock (units)<input name="stock" type="number" min="0" defaultValue={product.stock ?? 0} /></label>
          <label className="check full"><input type="checkbox" checked={hasOffer} onChange={(e) => setHasOffer(e.target.checked)} /> Put this product on offer</label>
          {hasOffer && (
            <>
              <label>Offer price (kr)<input name="salePrice" type="number" step="0.01" min="0" defaultValue={product.salePrice != null ? product.salePrice / 100 : ''} required /></label>
              <span />
              <label>Offer starts <span className="opt">(optional)</span><input name="saleStart" type="datetime-local" defaultValue={toInputDate(product.saleStart)} /></label>
              <label>Offer ends <span className="opt">(optional)</span><input name="saleEnd" type="datetime-local" defaultValue={toInputDate(product.saleEnd)} /></label>
            </>
          )}
          {collections.length > 0 && (
            <fieldset className="full collPick">
              <legend>Collections <span className="opt">(optional, a product can be in several)</span></legend>
              {collections.map((c) => (
                <label className="check" key={c.id}>
                  <input type="checkbox" name="collectionIds" value={c.id} defaultChecked={product.collections?.some((x: any) => x.id === c.id)} /> {c.icon} {c.name}
                </label>
              ))}
            </fieldset>
          )}
          <label className="check"><input name="active" type="checkbox" defaultChecked={product.active !== false} /> Visible in shop</label>
          <label className="check"><input name="featured" type="checkbox" defaultChecked={!!product.featured} /> ⭐ Feature on homepage</label>
        </div>
        {err && <div className="alert alert-error full">{err}</div>}
        <div className="modalActions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
        </div>
      </form>
    </Modal>
  );
}

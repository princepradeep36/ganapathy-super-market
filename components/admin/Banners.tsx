'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Modal, api, fromInputDate, toInputDate, toast } from './ui';

function state(b: any): [string, string] {
  const now = Date.now();
  if (!b.active) return ['Off', 'cancelled'];
  if (b.startsAt && new Date(b.startsAt).getTime() > now) return ['Scheduled', 'confirmed'];
  if (b.endsAt && new Date(b.endsAt).getTime() <= now) return ['Ended', 'cancelled'];
  return ['Live', 'completed'];
}

export default function Banners({ banners }: { banners: any[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<any | null>(null);

  async function toggle(b: any) {
    try {
      await api('/api/admin/banners/' + b.id, { method: 'PATCH', json: { active: !b.active } });
      toast(b.active ? 'Banner hidden' : 'Banner shown');
      router.refresh();
    } catch (x: any) {
      toast(x.message, 'err');
    }
  }

  return (
    <>
      <div className="ahead">
        <div>
          <span className="kicker">Home page</span><h1>Banners</h1>
          <p className="muted">Extra slides in the home page banner. The main shop banner is always first; these follow as slide 2, 3 and so on, in display order. Live offers, popular items and the WhatsApp slide come after them.</p>
        </div>
        <div className="aheadActions"><button className="btn" onClick={() => setEdit({})}>+ Add banner</button></div>
      </div>
      {banners.length ? (
        <div className="bannerAdminGrid">
          {banners.map((b, i) => {
            const [label, cls] = state(b);
            return (
              <div className={`panel bannerAdmin${b.active ? '' : ' rowMuted'}`} key={b.id}>
                <img src={b.image} alt="" />
                <div className="bannerAdminInfo">
                  <div><span className={`pill pill-${cls}`}>{label}</span> <small>Slide {i + 2} · order {b.sortOrder}</small>{b.popup && <> <span className="pill pill-confirmed">Pop-up</span></>}</div>
                  <b>{b.title}</b>
                  {b.link && <small className="muted">Opens {b.link}</small>}
                  {b.endsAt && <small className="muted">Until {new Date(b.endsAt).toLocaleDateString('sv-SE')}</small>}
                </div>
                <div className="bannerAdminActions">
                  <button className={`switch${b.active ? ' on' : ''}`} role="switch" aria-checked={b.active} aria-label="Show on home page" onClick={() => toggle(b)}><span /></button>
                  <button className="linkBtn" onClick={() => setEdit(b)}>Edit</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : <div className="emptyState small"><span aria-hidden>🖼️</span><p>No extra banners yet. Add one for a festival, a new arrival or a weekend offer.</p></div>}
      {edit && <BannerForm banner={edit} nextOrder={banners.length + 1} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); router.refresh(); }} />}
    </>
  );
}

function BannerForm({ banner, nextOrder, onClose, onSaved }: { banner: any; nextOrder: number; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(banner.image || null);
  const [fit, setFit] = useState<string>(banner.fit || 'FILL');
  const [focus, setFocus] = useState<string>(banner.focus || 'center');
  // Picks the fit from the picture's shape: wide pictures fill the slide, tall or square posters are shown whole.
  function autoFit(url: string) {
    const img = new Image();
    img.onload = () => { setFit(img.naturalWidth / img.naturalHeight >= 1.6 ? 'FILL' : 'WHOLE'); setFocus('center'); };
    img.src = url;
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const f = new FormData(e.currentTarget);
      let image = banner.image || '';
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        image = (await api<{ url: string }>('/api/admin/upload', { method: 'POST', body: fd })).url;
      }
      if (!image) throw new Error('Upload a banner image');
      const body = {
        image, title: f.get('title'), link: f.get('link'), sortOrder: f.get('sortOrder'), fit, focus,
        startsAt: fromInputDate(f.get('startsAt')), endsAt: fromInputDate(f.get('endsAt')), active: f.get('active') === 'on', popup: f.get('popup') === 'on',
      };
      await api(banner.id ? '/api/admin/banners/' + banner.id : '/api/admin/banners', { method: banner.id ? 'PUT' : 'POST', json: body });
      toast(banner.id ? 'Banner saved' : 'Banner added');
      onSaved();
    } catch (x: any) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!confirm('Delete this banner?')) return;
    try {
      await api('/api/admin/banners/' + banner.id, { method: 'DELETE' });
      toast('Banner deleted');
      onSaved();
    } catch (x: any) {
      setErr(x.message);
    }
  }

  return (
    <Modal title={banner.id ? 'Edit banner' : 'Add banner'} kicker="Banner" onClose={onClose} wide>
      <form onSubmit={save}>
        <div className={`bannerPreview${fit === 'FILL' ? ' bannerCover' : ''}`} style={{ ['--focus' as any]: focus }}>{preview ? <><span className="bannerBlur" style={{ backgroundImage: `url(${preview})` }} aria-hidden /><img src={preview} alt="" /></> : <span>No image yet</span>}</div>
        <label className="upload">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const x = e.target.files?.[0]; if (x) { const url = URL.createObjectURL(x); setFile(x); setPreview(url); autoFit(url); } }} />
          🖼️ {file ? file.name : banner.image ? 'Replace image' : 'Upload banner image'}
          <small>Any shape works: the fit is chosen automatically from the picture's shape (you can change it below). Wide images (about 2:1, e.g. 1800 × 900) fill the slide best. JPG, PNG or WebP · max 5 MB. The preview shows how it will look.</small>
        </label>
        <div className="formGrid">
          <label className="full">Description <span className="opt">(read aloud to blind visitors, not shown)</span><input name="title" defaultValue={banner.title || ''} required maxLength={120} placeholder="e.g. Diwali sweets and diyas, 15% off" /></label>
          <label className="full">Opens when tapped <span className="opt">(optional)</span><input name="link" defaultValue={banner.link || ''} maxLength={300} placeholder="/shop?col=diwali-2026 or https://…" /></label>
          <label>How it fits
            <select value={fit} onChange={(e) => setFit(e.target.value)}>
              <option value="FILL">Fill the whole slide (biggest; edges may be cut)</option>
              <option value="WHOLE">Show the whole image (smaller, blurred sides)</option>
            </select>
          </label>
          <label>Keep visible
            <select value={focus} onChange={(e) => setFocus(e.target.value)} disabled={fit !== 'FILL'}>
              <option value="top">Top part</option>
              <option value="center">Middle</option>
              <option value="bottom">Bottom part</option>
            </select>
          </label>
          <label>Display order<input name="sortOrder" type="number" defaultValue={banner.sortOrder ?? nextOrder} /></label>
          <span />
          <label>Show from <span className="opt">(optional)</span><input name="startsAt" type="datetime-local" defaultValue={toInputDate(banner.startsAt)} /></label>
          <label>Show until <span className="opt">(optional)</span><input name="endsAt" type="datetime-local" defaultValue={toInputDate(banner.endsAt)} /></label>
          <label className="check full"><input name="active" type="checkbox" defaultChecked={banner.active !== false} /> Show on home page</label>
          <label className="check full"><input name="popup" type="checkbox" defaultChecked={!!banner.popup} /> Also show as a pop-up when someone opens the shop <span className="opt">(once per visit; if several are ticked, the first in display order is used)</span></label>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <div className="modalActions">
          {banner.id && <button type="button" className="btn btn-ghost danger" onClick={remove}>Delete</button>}
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save banner'}</button>
        </div>
      </form>
    </Modal>
  );
}

'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Modal, api, fromInputDate, toInputDate, toast } from './ui';

function state(c: any): [string, string] {
  const now = Date.now();
  if (!c.active) return ['Off', 'cancelled'];
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return ['Scheduled', 'confirmed'];
  if (c.endsAt && new Date(c.endsAt).getTime() <= now) return ['Ended', 'cancelled'];
  return ['Live', 'completed'];
}

export default function Collections({ collections }: { collections: any[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErr('');
    try {
      const body = {
        name: f.get('name'), icon: f.get('icon'), description: f.get('description'), sortOrder: f.get('sortOrder'),
        startsAt: fromInputDate(f.get('startsAt')), endsAt: fromInputDate(f.get('endsAt')), active: f.get('active') === 'on',
      };
      await api(edit.id ? '/api/admin/collections/' + edit.id : '/api/admin/collections', { method: edit.id ? 'PUT' : 'POST', json: body });
      toast('Collection saved');
      setEdit(null);
      router.refresh();
    } catch (x: any) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(c: any) {
    if (!confirm(`Delete collection “${c.name}”? Its products stay in the shop.`)) return;
    try {
      await api('/api/admin/collections/' + c.id, { method: 'DELETE' });
      toast('Collection deleted');
      setEdit(null);
      router.refresh();
    } catch (x: any) {
      toast(x.message, 'err');
    }
  }

  return (
    <>
      <div className="ahead">
        <div><span className="kicker">Catalogue</span><h1>Collections</h1><p className="muted">Festival and seasonal shelves like Diwali or Navratri. A product can be in several. Live collections get their own row on the homepage and a link in the shop menu. Add products from each product’s Edit form.</p></div>
        <div className="aheadActions"><button className="btn" onClick={() => setEdit({})}>+ New collection</button></div>
      </div>
      {collections.length ? (
        <div className="catAdminGrid">
          {collections.map((c) => {
            const [label, cls] = state(c);
            return (
              <div className="panel catAdmin" key={c.id}>
                <span className="catIcon" aria-hidden>{c.icon}</span>
                <div>
                  <b>{c.name}</b>
                  <small><span className={`pill pill-${cls}`}>{label}</span> {c._count.products} product{c._count.products === 1 ? '' : 's'}{c.endsAt ? ` · until ${new Date(c.endsAt).toLocaleDateString('sv-SE')}` : ''}</small>
                </div>
                <div className="catAdminActions"><button className="linkBtn" onClick={() => setEdit(c)}>Edit</button></div>
              </div>
            );
          })}
        </div>
      ) : <div className="emptyState small"><span aria-hidden>🪔</span><p>No collections yet. Create one for Diwali, Navratri or Pongal, then tick it on the products that belong in it.</p></div>}
      {edit && (
        <Modal title={edit.id ? 'Edit collection' : 'New collection'} kicker="Collection" onClose={() => setEdit(null)} wide>
          <form onSubmit={save}>
            <div className="formGrid">
              <label className="full">Name<input name="name" defaultValue={edit.name} required placeholder="e.g. Diwali 2026" /></label>
              <label>Icon (emoji)<input name="icon" defaultValue={edit.icon || '🪔'} maxLength={8} /></label>
              <label>Display order<input name="sortOrder" type="number" defaultValue={edit.sortOrder ?? 0} /></label>
              <label className="full">Short text for customers <span className="opt">(optional)</span><input name="description" defaultValue={edit.description || ''} maxLength={300} placeholder="Sweets, diyas and everything for the festival of lights" /></label>
              <label>Show from <span className="opt">(optional)</span><input name="startsAt" type="datetime-local" defaultValue={toInputDate(edit.startsAt)} /></label>
              <label>Show until <span className="opt">(optional)</span><input name="endsAt" type="datetime-local" defaultValue={toInputDate(edit.endsAt)} /></label>
              <label className="check full"><input name="active" type="checkbox" defaultChecked={edit.active !== false} /> Active</label>
            </div>
            {err && <div className="alert alert-error">{err}</div>}
            <div className="modalActions">
              {edit.id && <button type="button" className="btn btn-ghost danger" onClick={() => remove(edit)}>Delete</button>}
              <button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save collection'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

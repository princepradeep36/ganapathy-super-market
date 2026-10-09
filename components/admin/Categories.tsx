'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Modal, api, toast } from './ui';

export default function Categories({ categories }: { categories: any[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const body = { name: f.get('name'), icon: f.get('icon'), sortOrder: f.get('sortOrder') };
      await api(edit.id ? '/api/admin/categories/' + edit.id : '/api/admin/categories', { method: edit.id ? 'PUT' : 'POST', json: body });
      toast('Category saved');
      setEdit(null);
      router.refresh();
    } catch (x: any) {
      toast(x.message, 'err');
    } finally {
      setBusy(false);
    }
  }
  async function remove(c: any) {
    if (!confirm(`Delete category “${c.name}”?`)) return;
    try {
      await api('/api/admin/categories/' + c.id, { method: 'DELETE' });
      toast('Category deleted');
      router.refresh();
    } catch (x: any) {
      toast(x.message, 'err');
    }
  }

  return (
    <>
      <div className="ahead">
        <div><span className="kicker">Catalogue</span><h1>Categories</h1><p className="muted">Shown as tiles on the homepage and in the shop menu, in this order.</p></div>
        <div className="aheadActions"><button className="btn" onClick={() => setEdit({})}>+ New category</button></div>
      </div>
      <div className="catAdminGrid">
        {categories.map((c) => (
          <div className="panel catAdmin" key={c.id}>
            <span className="catIcon" aria-hidden>{c.icon}</span>
            <div><b>{c.name}</b><small>{c._count.products} product{c._count.products === 1 ? '' : 's'} · order {c.sortOrder}</small></div>
            <div className="catAdminActions">
              <button className="linkBtn" onClick={() => setEdit(c)}>Edit</button>
              {c._count.products === 0 && <button className="linkBtn danger" onClick={() => remove(c)}>Delete</button>}
            </div>
          </div>
        ))}
      </div>
      {edit && (
        <Modal title={edit.id ? 'Edit category' : 'New category'} kicker="Category" onClose={() => setEdit(null)}>
          <form onSubmit={save}>
            <div className="formGrid">
              <label className="full">Name<input name="name" defaultValue={edit.name} required placeholder="e.g. Frozen foods" /></label>
              <label>Icon (emoji)<input name="icon" defaultValue={edit.icon || '🛒'} maxLength={8} /></label>
              <label>Display order<input name="sortOrder" type="number" defaultValue={edit.sortOrder ?? categories.length + 1} /></label>
            </div>
            <div className="modalActions">
              <button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

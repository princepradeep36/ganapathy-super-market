'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Modal, api, fromInputDate, kr, toInputDate, toast } from './ui';

function state(c: any) {
  const now = Date.now();
  if (!c.active) return ['Inactive', 'cancelled'];
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return ['Scheduled', 'confirmed'];
  if (c.endsAt && new Date(c.endsAt).getTime() < now) return ['Expired', 'cancelled'];
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return ['Used up', 'cancelled'];
  return ['Live', 'completed'];
}

export default function Coupons({ coupons }: { coupons: any[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const f = new FormData(e.currentTarget);
      const body = {
        name: f.get('name'), code: f.get('code'), type: f.get('type'), value: f.get('value'), minOrder: f.get('minOrder'), maxDiscount: f.get('maxDiscount'),
        startsAt: fromInputDate(f.get('startsAt')), endsAt: fromInputDate(f.get('endsAt')), usageLimit: f.get('usageLimit'),
        stackWithSales: f.get('stackWithSales') === 'on', active: f.get('active') === 'on',
      };
      await api(edit.id ? '/api/admin/coupons/' + edit.id : '/api/admin/coupons', { method: edit.id ? 'PUT' : 'POST', json: body });
      toast('Coupon saved');
      setEdit(null);
      router.refresh();
    } catch (x: any) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="ahead">
        <div><span className="kicker">Promotions</span><h1>Coupons</h1><p className="muted">Basket-wide discount codes for Diwali, Pongal, Eid and more. The newest live code is shown on the homepage.</p></div>
        <div className="aheadActions"><button className="btn" onClick={() => setEdit({})}>+ New coupon</button></div>
      </div>
      {coupons.length ? (
        <div className="couponGrid">
          {coupons.map((c) => {
            const [label, cls] = state(c);
            const pct = c.usageLimit ? Math.min(100, Math.round((c.usedCount / c.usageLimit) * 100)) : null;
            return (
              <div className="panel coupon" key={c.id}>
                <div className="couponTop"><span className={`pill pill-${cls}`}>{label}</span><button className="linkBtn" onClick={() => setEdit(c)}>Edit</button></div>
                <code>{c.code}</code>
                <p>{c.name}</p>
                <strong>{c.type === 'PERCENT' ? `${c.value}% off` : `${kr(c.value)} off`}</strong>
                <small className="muted">
                  {c.minOrder ? `Min. ${kr(c.minOrder)}` : 'No minimum'}{c.maxDiscount ? ` · max ${kr(c.maxDiscount)}` : ''}
                  {c.endsAt ? ` · ends ${new Date(c.endsAt).toLocaleDateString('sv-SE')}` : ''}
                </small>
                <div className="usage">
                  <span>Used {c.usedCount}{c.usageLimit ? ` of ${c.usageLimit}` : ' times'}</span>
                  {pct != null && <div className="meter"><i style={{ width: pct + '%' }} /></div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : <div className="emptyState small"><span aria-hidden>🏷️</span><p>No coupons yet. Create one for your next festival campaign.</p></div>}
      {edit && (
        <Modal title={edit.id ? 'Edit coupon' : 'New coupon'} kicker="Campaign" onClose={() => setEdit(null)} wide>
          <form onSubmit={save}>
            <div className="formGrid">
              <label>Campaign name<input name="name" defaultValue={edit.name} placeholder="Diwali 2026" required /></label>
              <label>Code customers type<input name="code" defaultValue={edit.code} placeholder="DIWALI10" required style={{ textTransform: 'uppercase' }} /></label>
              <label>Discount type
                <select name="type" defaultValue={edit.type || 'PERCENT'}><option value="PERCENT">Percentage (%)</option><option value="FIXED">Fixed amount (kr)</option></select>
              </label>
              <label>Discount value<input name="value" type="number" step="0.01" min="0" defaultValue={edit.value == null ? '' : edit.type === 'FIXED' ? edit.value / 100 : edit.value} required /></label>
              <label>Minimum basket (kr)<input name="minOrder" type="number" step="0.01" min="0" defaultValue={edit.minOrder ? edit.minOrder / 100 : ''} /></label>
              <label>Maximum discount (kr) <span className="opt">(optional)</span><input name="maxDiscount" type="number" step="0.01" min="0" defaultValue={edit.maxDiscount ? edit.maxDiscount / 100 : ''} /></label>
              <label>Starts <span className="opt">(optional)</span><input name="startsAt" type="datetime-local" defaultValue={toInputDate(edit.startsAt)} /></label>
              <label>Ends <span className="opt">(optional)</span><input name="endsAt" type="datetime-local" defaultValue={toInputDate(edit.endsAt)} /></label>
              <label>Total uses allowed <span className="opt">(optional)</span><input name="usageLimit" type="number" min="1" defaultValue={edit.usageLimit || ''} /></label>
              <span />
              <label className="check"><input name="stackWithSales" type="checkbox" defaultChecked={edit.stackWithSales !== false} /> Works with items already on offer</label>
              <label className="check"><input name="active" type="checkbox" defaultChecked={edit.active !== false} /> Active</label>
            </div>
            {err && <div className="alert alert-error">{err}</div>}
            <div className="modalActions">
              <button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save coupon'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

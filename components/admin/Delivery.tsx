'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { availableSlots, type Schedule } from '@/lib/schedule';
import { api, toast } from './ui';

const WEEK: [number, string][] = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun']];

/** Admin: which days and times customers can pick for delivery or pickup. */
export default function Delivery({ schedule }: { schedule: Schedule }) {
  const router = useRouter();
  const [s, setS] = useState<Schedule>(schedule);
  const [newSlot, setNewSlot] = useState('');
  const [newClosed, setNewClosed] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (patch: Partial<Schedule>) => setS((x) => ({ ...x, ...patch }));
  const preview = availableSlots(s);

  function addSlot() {
    const v = newSlot.trim();
    if (!v) return;
    set({ slots: [...s.slots, v] });
    setNewSlot('');
  }
  async function save() {
    setBusy(true);
    setErr('');
    try {
      await api('/api/admin/schedule', { method: 'PUT', json: s });
      toast('Delivery times saved');
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
        <div><span className="kicker">Checkout</span><h1>Delivery times</h1><p className="muted">The days and times customers can choose for home delivery and store pickup. Changes apply to new orders straight away.</p></div>
        <div className="aheadActions"><button className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
      </div>
      {err && <div className="alert alert-error">{err}</div>}
      <div className="deliveryGrid">
        <section className="panel">
          <h3>Days</h3>
          <p className="muted small">Days when you deliver or hand out orders.</p>
          <div className="dayPick">
            {WEEK.map(([d, label]) => (
              <label key={d} className={s.days.includes(d) ? 'on' : ''}>
                <input type="checkbox" checked={s.days.includes(d)} onChange={(e) => set({ days: e.target.checked ? [...s.days, d] : s.days.filter((x) => x !== d) })} />
                {label}
              </label>
            ))}
          </div>

          <h3>Time slots</h3>
          <p className="muted small">Shown in this order. Write them like 10:00–12:00.</p>
          <ul className="slotList">
            {s.slots.map((slot, i) => (
              <li key={slot + i}>
                <span>{slot}</span>
                <button className="linkBtn danger" onClick={() => set({ slots: s.slots.filter((_, j) => j !== i) })}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="inlineAdd">
            <input value={newSlot} onChange={(e) => setNewSlot(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSlot()} placeholder="e.g. 14:00–16:00" aria-label="New time slot" />
            <button className="btn btn-ghost btn-sm" onClick={addSlot}>+ Add</button>
          </div>
        </section>

        <section className="panel">
          <h3>Rules</h3>
          <div className="formGrid">
            <label>Order at least (hours before the slot)
              <input type="number" min={0} step={0.5} value={s.cutoffMinutes / 60} onChange={(e) => set({ cutoffMinutes: Math.round(Number(e.target.value) * 60) })} />
            </label>
            <label>Days customers can choose ahead
              <input type="number" min={1} max={14} value={s.daysAhead} onChange={(e) => set({ daysAhead: Number(e.target.value) })} />
            </label>
            <label className="check full"><input type="checkbox" checked={s.allowAsap} onChange={(e) => set({ allowAsap: e.target.checked })} /> Also offer “As soon as possible”</label>
          </div>

          <h3>Closed dates</h3>
          <p className="muted small">Holidays or days off: no slots on these dates.</p>
          <ul className="slotList">
            {s.closedDates.map((d) => (
              <li key={d}><span>{new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <button className="linkBtn danger" onClick={() => set({ closedDates: s.closedDates.filter((x) => x !== d) })}>Remove</button></li>
            ))}
          </ul>
          <div className="inlineAdd">
            <input type="date" value={newClosed} onChange={(e) => setNewClosed(e.target.value)} aria-label="Closed date" />
            <button className="btn btn-ghost btn-sm" onClick={() => { if (newClosed && !s.closedDates.includes(newClosed)) set({ closedDates: [...s.closedDates, newClosed].sort() }); setNewClosed(''); }}>+ Add</button>
          </div>
        </section>

        <section className="panel">
          <h3>What customers see now</h3>
          <p className="muted small">Preview of the checkout dropdown with these settings (save to apply).</p>
          {preview.length || s.allowAsap ? (
            <ul className="slotPreview">
              {preview.map((p) => <li key={p.value}>{p.label}</li>)}
              {s.allowAsap && <li>As soon as possible</li>}
            </ul>
          ) : <div className="alert alert-warn">No times would be available, so customers couldn’t check out. Add a day or slot.</div>}
        </section>
      </div>
    </>
  );
}

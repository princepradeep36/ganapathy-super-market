'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { STATUS_LABEL, customerStatusLabel, nextStatus } from '@/lib/status';
import { ago, api, kr, ref, toast } from './ui';

const FILTERS: [string, string, string[]][] = [
  ['active', 'To handle', ['NEW', 'CONFIRMED', 'PACKED', 'READY']],
  ['NEW', 'New', ['NEW']],
  ['COMPLETED', 'Completed', ['COMPLETED']],
  ['CANCELLED', 'Cancelled', ['CANCELLED']],
  ['all', 'All', []],
];
const ACTION: Record<string, (delivery: boolean) => string> = {
  CONFIRMED: () => 'Confirm order',
  PACKED: () => 'Mark as packed',
  READY: (d) => (d ? 'Out for delivery' : 'Ready for pickup'),
  COMPLETED: (d) => (d ? 'Mark delivered' : 'Mark picked up'),
};
const PAY: Record<string, string> = { PAY_AT_PICKUP: 'Pay at pickup', PAY_ON_DELIVERY: 'Pay on delivery', SWISH: 'Swish' };
const wa = (phone: string) => 'https://wa.me/' + phone.replace(/\D/g, '').replace(/^0/, '46');

export default function Orders({ orders }: { orders: any[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState('active');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = location.hash.slice(1);
    if (h) { setOpenId(h); setFilter('all'); }
  }, []);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(([k, , s]) => [k, s.length ? orders.filter((o) => s.includes(o.status)).length : orders.length])), [orders]);
  const list = useMemo(() => {
    const s = FILTERS.find((f) => f[0] === filter)![2];
    const needle = q.trim().toLowerCase();
    return orders.filter((o) => (!s.length || s.includes(o.status)) && (!needle || [ref(o.id), o.customerName, o.phone, o.email].join(' ').toLowerCase().includes(needle)));
  }, [orders, filter, q]);
  const open = orders.find((o) => o.id === openId);

  async function update(o: any, data: { status?: string; paid?: boolean }, msg: string) {
    setBusy(true);
    try {
      await api('/api/admin/orders/' + o.id, { method: 'PATCH', json: data });
      toast(msg);
      router.refresh();
    } catch (e: any) {
      toast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="ahead">
        <div><span className="kicker">Sales</span><h1>Orders</h1><p className="muted">Confirm, pack and hand over orders. Cancelling returns items to stock.</p></div>
        <div className="aheadActions"><a className="btn btn-ghost" href="/api/admin/orders/export?days=31">⬇ Export CSV (31 days)</a></div>
      </div>
      <div className="toolbar">
        <div className="segs" role="tablist">
          {FILTERS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
              {label} <i>{counts[k]}</i>
            </button>
          ))}
        </div>
        <input className="searchIn" type="search" placeholder="Search name, phone, order no…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="panel flush">
        {list.length ? (
          <div className="tableScroll">
            <table className="atable">
              <thead><tr><th>Order</th><th>Customer</th><th>Fulfilment</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} onClick={() => setOpenId(o.id)} className={`clickRow${o.status === 'NEW' ? ' rowNew' : ''}`}>
                    <td><b>#{ref(o.id)}</b><small>{ago(o.createdAt)}</small></td>
                    <td>{o.customerName}<small>{o.phone}</small></td>
                    <td>{o.deliveryMethod === 'DELIVERY' ? '🚚 Delivery' : '🏪 Pickup'}<small>{o.deliverySlot || 'ASAP'}</small></td>
                    <td>{o.items.reduce((a: number, i: any) => a + i.quantity, 0)}</td>
                    <td><b>{kr(o.total)}</b></td>
                    <td>{o.paid ? <span className="pill pill-completed">Paid</span> : <span className="muted small">{PAY[o.paymentMethod] || o.paymentMethod}</span>}</td>
                    <td><span className={`pill pill-${o.status.toLowerCase()}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="emptyState small"><span aria-hidden>🧾</span><p>No orders here{q ? ' matching your search' : ''}.</p></div>
        )}
      </div>

      {open && (
        <div className="sheetRoot" onMouseDown={(e) => e.target === e.currentTarget && setOpenId(null)}>
          <aside className="sheet" role="dialog" aria-modal="true" aria-label={`Order ${ref(open.id)}`}>
            <header className="sheetHead">
              <div>
                <span className="kicker">Order #{ref(open.id)}</span>
                <h2>{open.customerName}</h2>
                <span className={`pill pill-${open.status.toLowerCase()}`}>{STATUS_LABEL[open.status]}</span>{' '}
                <span className="muted small">{new Date(open.createdAt).toLocaleString('sv-SE', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <button className="iconBtn" onClick={() => setOpenId(null)} aria-label="Close">✕</button>
            </header>

            <div className="sheetBody">
              {open.status !== 'CANCELLED' && open.status !== 'COMPLETED' && (
                <div className="nextStep">
                  {(() => {
                    const n = nextStatus(open.status);
                    return n ? (
                      <button className="btn btn-lg btn-block" disabled={busy} onClick={() => update(open, { status: n, ...(n === 'COMPLETED' ? { paid: true } : {}) }, `Order marked “${customerStatusLabel(n, open.deliveryMethod)}”`)}>
                        {ACTION[n](open.deliveryMethod === 'DELIVERY')} →
                      </button>
                    ) : null;
                  })()}
                  <small className="muted">Customers see the status on their order page.</small>
                </div>
              )}

              <div className="contactRow">
                <a className="btn btn-ghost btn-sm" href={`tel:${open.phone}`}>📞 Call</a>
                <a className="btn btn-ghost btn-sm" href={wa(open.phone)} target="_blank" rel="noreferrer">💬 WhatsApp</a>
                <a className="btn btn-ghost btn-sm" href={`mailto:${open.email}?subject=Your order ${ref(open.id)}`}>✉️ Email</a>
                <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>🖨 Packing slip</button>
              </div>

              <dl className="facts">
                <div><dt>Fulfilment</dt><dd>{open.deliveryMethod === 'DELIVERY' ? 'Home delivery' : 'Store pickup'} · {open.deliverySlot || 'ASAP'}</dd></div>
                {open.deliveryMethod === 'DELIVERY' && <div><dt>Address</dt><dd>{open.address}, {open.postalCode} {open.city}</dd></div>}
                <div><dt>Phone</dt><dd>{open.phone}</dd></div>
                <div><dt>Email</dt><dd>{open.email}</dd></div>
                <div><dt>Payment</dt><dd>{PAY[open.paymentMethod] || open.paymentMethod} · {open.paid ? <b className="okText">Paid</b> : 'Not paid yet'}</dd></div>
                {open.notes && <div><dt>Notes</dt><dd className="note">“{open.notes}”</dd></div>}
              </dl>

              <h3>Items to pack</h3>
              <ul className="packList">
                {open.items.map((i: any) => (
                  <li key={i.id}><label><input type="checkbox" /> <b>{i.quantity} ×</b> {i.name}</label><span>{kr(i.unitPrice * i.quantity)}</span></li>
                ))}
              </ul>
              <dl className="sumRows">
                <div><dt>Items</dt><dd>{kr(open.originalSubtotal)}</dd></div>
                {open.itemDiscountTotal > 0 && <div className="saving"><dt>Offer savings</dt><dd>−{kr(open.itemDiscountTotal)}</dd></div>}
                {open.orderDiscountTotal > 0 && <div className="saving"><dt>Code {open.couponCode}</dt><dd>−{kr(open.orderDiscountTotal)}</dd></div>}
                <div><dt>Delivery</dt><dd>{open.deliveryFee ? kr(open.deliveryFee) : 'Free'}</dd></div>
                <div className="total"><dt>Total to collect</dt><dd>{kr(open.total)}</dd></div>
              </dl>

              <div className="sheetFoot">
                {open.status !== 'CANCELLED' && (
                  <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => update(open, { paid: !open.paid }, open.paid ? 'Marked as unpaid' : 'Marked as paid')}>
                    {open.paid ? 'Mark unpaid' : '✓ Mark paid'}
                  </button>
                )}
                {open.status !== 'CANCELLED' && open.status !== 'COMPLETED' && (
                  <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => confirm('Cancel this order? Items go back into stock.') && update(open, { status: 'CANCELLED' }, 'Order cancelled, stock restored')}>
                    Cancel order
                  </button>
                )}
              </div>
            </div>

            {/* Printed via window.print() — only this block is visible on paper. */}
            <div className="printSlip">
              <h1>Packing slip · #{ref(open.id)}</h1>
              <p>{new Date(open.createdAt).toLocaleString('sv-SE')} · {open.deliveryMethod === 'DELIVERY' ? 'DELIVERY' : 'PICKUP'} · {open.deliverySlot || 'ASAP'}</p>
              <p><b>{open.customerName}</b> · {open.phone}<br />{open.deliveryMethod === 'DELIVERY' && `${open.address}, ${open.postalCode} ${open.city}`}</p>
              {open.notes && <p>Note: {open.notes}</p>}
              <table><tbody>{open.items.map((i: any) => <tr key={i.id}><td>☐</td><td>{i.quantity} ×</td><td>{i.name}</td><td>{kr(i.unitPrice * i.quantity)}</td></tr>)}</tbody></table>
              <p><b>Total: {kr(open.total)}</b> · {open.paid ? 'PAID' : 'TO COLLECT: ' + (PAY[open.paymentMethod] || '')}</p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

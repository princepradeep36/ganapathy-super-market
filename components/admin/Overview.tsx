'use client';
import Link from 'next/link';
import { useState } from 'react';
import { STATUS_LABEL } from '@/lib/status';
import type { Stats } from './AdminApp';
import { ago, kr, ref } from './ui';

function SalesChart({ days }: { days: Stats['days'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 200, padL = 44, padB = 26, padT = 12;
  const max = Math.max(1, ...days.map((d) => d.total));
  // Round the axis max up to a friendly number.
  const step = Math.pow(10, Math.floor(Math.log10(max / 100))) * 100;
  const top = Math.ceil(max / step / 2) * step * 2 || 100;
  const bw = (W - padL) / days.length;
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / top);
  const ticks = [0, top / 2, top];
  const label = (iso: string) => new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
  const h = hover != null ? days[hover] : null;
  return (
    <div className="chartWrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Revenue per day, last 14 days">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(t)} y2={y(t)} className="grid" />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" className="axis">{Math.round(t / 100)}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = padL + i * bw + 2;
          const w = Math.max(4, bw - 6);
          const yy = y(d.total);
          const hgt = Math.max(0, H - padB - yy);
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + i * bw} y={padT} width={bw} height={H - padT - padB} fill="transparent" />
              {hgt > 0 && (() => {
                const r = Math.min(4, hgt, w / 2);
                return <path className={`bar${hover === i ? ' on' : ''}`} d={`M${x},${H - padB} v${-(hgt - r)} q0,${-r} ${r},${-r} h${w - 2 * r} q${r},0 ${r},${r} v${hgt - r} z`} />;
              })()}
              {(i % 2 === 1 || days.length <= 7) && <text x={x + w / 2} y={H - 8} textAnchor="middle" className="axis">{label(d.date)}</text>}
            </g>
          );
        })}
      </svg>
      {h && (
        <div className="chartTip" style={{ left: `${((padL + (hover! + 0.5) * bw) / W) * 100}%` }}>
          <b>{kr(h.total)}</b>
          <span>{h.count} order{h.count === 1 ? '' : 's'} · {label(h.date)}</span>
        </div>
      )}
      <p className="sr-only">{days.map((d) => `${label(d.date)}: ${kr(d.total)}`).join(', ')}</p>
    </div>
  );
}

export default function Overview({ stats, orders, products }: { stats: Stats; orders: any[]; products: any[] }) {
  const low = products.filter((p) => p.active && p.stock <= stats.lowStockThreshold).sort((a, b) => a.stock - b.stock);
  const newOrders = orders.filter((o) => o.status === 'NEW');
  const hour = new Date().getHours();
  return (
    <>
      <div className="ahead">
        <div>
          <span className="kicker">Overview</span>
          <h1>Good {hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'} 👋</h1>
          <p className="muted">Here’s how the shop is doing today.</p>
        </div>
        <div className="aheadActions">
          <Link href="/admin?tab=products" className="btn btn-ghost">+ Add product</Link>
          <Link href="/admin?tab=orders" className="btn">Open orders{stats.pending ? ` (${stats.pending})` : ''}</Link>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi"><span>Today’s sales</span><strong>{kr(stats.todayRevenue)}</strong><small>{stats.todayOrders} order{stats.todayOrders === 1 ? '' : 's'} today</small></div>
        <div className={`kpi${stats.newOrders ? ' kpi-alert' : ''}`}><span>To handle</span><strong>{stats.pending}</strong><small>{stats.newOrders} new · waiting for you</small></div>
        <div className="kpi"><span>Last 30 days</span><strong>{kr(stats.revenue30)}</strong><small>{stats.orders30} orders · avg {kr(stats.aov30)}</small></div>
        <div className={`kpi${low.length ? ' kpi-warn' : ''}`}><span>Low stock</span><strong>{low.length}</strong><small>≤ {stats.lowStockThreshold} units left</small></div>
      </div>

      <div className="agrid">
        <section className="panel span2">
          <div className="panelHead"><h2>Sales, last 14 days</h2><span className="muted small">SEK · excludes cancelled</span></div>
          <SalesChart days={stats.days} />
        </section>
        <section className="panel">
          <div className="panelHead"><h2>Best sellers</h2><span className="muted small">30 days</span></div>
          {stats.top.length ? (
            <ol className="rankList">
              {stats.top.map((t, i) => {
                const pct = Math.round((t.qty / Math.max(1, stats.top[0].qty)) * 100);
                return <li key={t.name}><span className="rk">{i + 1}</span><span className="rkName">{t.name}<i style={{ width: pct + '%' }} /></span><b>{t.qty}</b></li>;
              })}
            </ol>
          ) : <p className="muted">Sales will appear here after the first orders.</p>}
        </section>
      </div>

      <div className="agrid">
        <section className="panel span2">
          <div className="panelHead"><h2>New orders</h2><Link href="/admin?tab=orders" className="linkBtn">All orders →</Link></div>
          {newOrders.length ? (
            <ul className="miniOrders">
              {newOrders.slice(0, 6).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin?tab=orders#${o.id}`}>
                    <b>#{ref(o.id)}</b>
                    <span>{o.customerName}<small>{o.deliveryMethod === 'DELIVERY' ? '🚚 Delivery' : '🏪 Pickup'} · {o.deliverySlot || 'ASAP'}</small></span>
                    <span className="muted small">{ago(o.createdAt)}</span>
                    <b>{kr(o.total)}</b>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">All caught up — no new orders waiting. {orders[0] && <>Last order: #{ref(orders[0].id)} ({STATUS_LABEL[orders[0].status]}).</>}</p>
          )}
        </section>
        <section className="panel">
          <div className="panelHead"><h2>Restock soon</h2><Link href="/admin?tab=products" className="linkBtn">Products →</Link></div>
          {low.length ? (
            <ul className="lowList">
              {low.slice(0, 7).map((p) => (
                <li key={p.id}><span>{p.name}</span><b className={p.stock === 0 ? 'out' : ''}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</b></li>
              ))}
            </ul>
          ) : <p className="muted">Stock levels look healthy.</p>}
        </section>
      </div>
    </>
  );
}

'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ago, api, toast } from './ui';

export default function Requests({ requests }: { requests: any[] }) {
  const router = useRouter();
  const [view, setView] = useState('NEW');
  const list = requests.filter((r) => view === 'ALL' || r.status === view);

  async function act(r: any, method: 'PATCH' | 'DELETE', msg: string) {
    if (method === 'DELETE' && !confirm(`Delete the request for “${r.productName}”?`)) return;
    try {
      await api('/api/admin/requests/' + r.id, method === 'PATCH' ? { method, json: { status: r.status === 'NEW' ? 'DONE' : 'NEW' } } : { method });
      toast(msg);
      router.refresh();
    } catch (x: any) {
      toast(x.message, 'err');
    }
  }

  const count = (s: string) => requests.filter((r) => r.status === s).length;
  const VIEWS: [string, string][] = [['NEW', `Open (${count('NEW')})`], ['DONE', `Done (${count('DONE')})`], ['ALL', 'All']];
  return (
    <>
      <div className="ahead">
        <div><span className="kicker">Customers</span><h1>Product requests</h1><p className="muted">Products customers asked you to stock. Contact them when it arrives, then mark it done.</p></div>
      </div>
      <div className="toolbar">
        <div className="segs">{VIEWS.map(([k, l]) => <button key={k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>)}</div>
      </div>
      <div className="panel flush">
        {list.length ? (
          <div className="tableScroll">
            <table className="atable">
              <thead><tr><th>Product asked for</th><th>Customer</th><th>When</th><th /></tr></thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className={r.status === 'DONE' ? 'rowMuted' : ''}>
                    <td><b>{r.productName}</b>{r.details && <small className="reqDetails">{r.details}</small>}</td>
                    <td>
                      <b>{r.name}</b>
                      {r.phone && <small><a href={`tel:${r.phone}`}>{r.phone}</a></small>}
                      {r.email && <small><a href={`mailto:${r.email}`}>{r.email}</a></small>}
                    </td>
                    <td>{ago(r.createdAt)}</td>
                    <td className="right reqActions">
                      <button className="linkBtn" onClick={() => act(r, 'PATCH', r.status === 'NEW' ? 'Marked as done' : 'Reopened')}>{r.status === 'NEW' ? 'Mark done' : 'Reopen'}</button>
                      <button className="linkBtn danger" onClick={() => act(r, 'DELETE', 'Request deleted')}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="emptyState small"><span aria-hidden>🙋</span><p>{view === 'NEW' ? 'No open requests.' : 'Nothing here yet.'}</p></div>}
      </div>
    </>
  );
}

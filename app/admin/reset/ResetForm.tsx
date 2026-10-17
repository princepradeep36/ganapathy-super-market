'use client';
import { useState } from 'react';
import { LogoMark } from '@/components/Logo';

export default function ResetForm({ token }: { token: string }) {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get('password') || '');
    if (password !== f.get('confirm')) return setMsg('The two passwords don’t match');
    setBusy(true);
    setMsg('');
    const r = await fetch('/api/admin/reset', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, password }) });
    if (r.ok) { location.href = '/admin'; return; }
    const d = await r.json().catch(() => ({}));
    setMsg(d.error || 'Could not change the password');
    setBusy(false);
  }
  return (
    <main className="loginPage">
      <form className="loginCard" onSubmit={go}>
        <LogoMark size={72} />
        <h1>Choose a new password</h1>
        {token ? (
          <>
            <p className="muted">At least 10 characters. You’ll be signed in straight after.</p>
            <label>New password<input name="password" type="password" autoComplete="new-password" minLength={10} required autoFocus /></label>
            <label>Repeat new password<input name="confirm" type="password" autoComplete="new-password" minLength={10} required /></label>
            {msg && <div className="alert alert-error">{msg}</div>}
            <button className="btn btn-block btn-lg" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
          </>
        ) : <div className="alert alert-error">This link is incomplete. Open the link from the e-mail again, or ask for a new one.</div>}
        <a href="/admin/forgot" className="linkBtn">Ask for a new link</a>
      </form>
    </main>
  );
}

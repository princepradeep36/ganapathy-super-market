'use client';
import { useState } from 'react';
import { LogoMark } from '@/components/Logo';

export default function Forgot() {
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/admin/forgot', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: f.get('email') }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setSent(true);
    else setMsg(d.error || 'Something went wrong');
    setBusy(false);
  }
  return (
    <main className="loginPage">
      <form className="loginCard" onSubmit={go}>
        <LogoMark size={72} />
        <h1>Forgot password</h1>
        {sent ? (
          <>
            <p className="muted">If that is the admin e-mail address, a link to choose a new password is on its way. It works once, for 60 minutes. Check the spam folder too.</p>
            <a href="/admin/login" className="btn btn-block">Back to sign in</a>
          </>
        ) : (
          <>
            <p className="muted">Enter the admin e-mail address and we’ll send you a link to choose a new password.</p>
            <label>Email<input name="email" type="email" autoComplete="username" required autoFocus /></label>
            {msg && <div className="alert alert-error">{msg}</div>}
            <button className="btn btn-block btn-lg" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
            <a href="/admin/login" className="linkBtn">← Back to sign in</a>
          </>
        )}
      </form>
    </main>
  );
}

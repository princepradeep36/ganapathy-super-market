'use client';
import { useState } from 'react';
import { LogoMark } from '@/components/Logo';

export default function Forgot() {
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState<string[] | 'reset' | null>(null);
  const [busy, setBusy] = useState(false);

  async function request(body: object) {
    setBusy(true);
    setMsg('');
    const r = await fetch('/api/admin/forgot', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setSent(d.sentTo || 'reset');
    else setMsg(d.error || 'Something went wrong');
    setBusy(false);
  }
  function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    request({ email: new FormData(e.currentTarget).get('email') });
  }

  return (
    <main className="loginPage">
      <form className="loginCard" onSubmit={go}>
        <LogoMark size={72} />
        <h1>Forgot your sign-in?</h1>
        {sent ? (
          <>
            {sent === 'reset'
              ? <p className="muted">If that is the admin e-mail address, a link to choose a new password is on its way. It works once, for 60 minutes.</p>
              : <p className="muted">We sent the sign-in e-mail and a link to choose a new password to <b>{sent.join(' and ')}</b>. The link works once, for 60 minutes.</p>}
            <p className="muted small">Nothing arrived? Check the spam folder.</p>
            <a href="/admin/login" className="btn btn-block">Back to sign in</a>
          </>
        ) : (
          <>
            <p className="muted">Enter the admin e-mail address and we’ll send you a link to choose a new password.</p>
            <label>Email<input name="email" type="email" autoComplete="username" required autoFocus /></label>
            {msg && <div className="alert alert-error">{msg}</div>}
            <button className="btn btn-block btn-lg" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
            <div className="forgotAlt">
              <b>Don’t remember the sign-in e-mail?</b>
              <span>We’ll e-mail it, with a reset link, to the shop’s own inbox.</span>
              <button type="button" className="btn btn-ghost btn-block" disabled={busy} onClick={() => request({ remind: true })}>Send me my sign-in details</button>
            </div>
            <a href="/admin/login" className="linkBtn">← Back to sign in</a>
          </>
        )}
      </form>
    </main>
  );
}

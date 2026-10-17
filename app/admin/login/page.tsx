'use client';
import { useState } from 'react';
import { LogoMark } from '@/components/Logo';

export default function Login() {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: f.get('email'), password: f.get('password') }) });
    if (r.ok) { location.href = '/admin'; return; }
    const d = await r.json().catch(() => ({}));
    setMsg(d.error || 'Sign-in failed');
    setBusy(false);
  }
  return (
    <main className="loginPage">
      <form className="loginCard" onSubmit={go}>
        <LogoMark size={72} />
        <h1>Store admin</h1>
        <p className="muted">Sign in to manage orders, products and offers.</p>
        <label>Email<input name="email" type="email" autoComplete="username" required autoFocus /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        {msg && <div className="alert alert-error">{msg}</div>}
        <button className="btn btn-block btn-lg" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <a href="/admin/forgot" className="linkBtn">Forgot password?</a>
        <a href="/" className="linkBtn">← Back to shop</a>
      </form>
    </main>
  );
}

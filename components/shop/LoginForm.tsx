'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { translateError } from '@/lib/i18n';
import { useLang, useT } from './I18n';

const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);
const FacebookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="12" fill="#fff" />
    <path fill="#1877F2" d="M15.1 24v-9.3h3.1l.5-3.6h-3.6V8.8c0-1 .3-1.8 1.8-1.8h1.9V3.8c-.3 0-1.5-.1-2.8-.1-2.8 0-4.7 1.7-4.7 4.8v2.7H8.2v3.6h3.1V24h3.8z" />
  </svg>
);

/** "Log in" / "Sign up" page: Google, Facebook and a 6-digit code by e-mail. */
export default function LoginForm({ signup, google, facebook, error }: { signup: boolean; google: boolean; facebook: boolean; error?: string }) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const [step, setStep] = useState<'start' | 'email' | 'code'>('start');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(error ? translateError(lang, error) : '');
  const verb = signup ? 'Sign up' : 'Log in';

  async function post(url: string, body: object) {
    setBusy(true);
    setErr('');
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setErr(translateError(lang, d.error || 'Something went wrong'));
      return r.ok;
    } finally {
      setBusy(false);
    }
  }
  async function sendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await post('/api/account/code', { email })) setStep('code');
  }
  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = new FormData(e.currentTarget).get('code');
    if (await post('/api/account/verify', { email, code })) {
      router.push('/orders');
      router.refresh();
    }
  }

  return (
    <div className="login">
      <h1>{t(verb)}</h1>
      <p className="loginSwitch">
        {signup
          ? <>{t('Already have an account?')} <Link href="/login">{t('Log in')}</Link></>
          : <>{t('New to this site?')} <Link href="/login?signup=1">{t('Sign up')}</Link></>}
      </p>

      {step === 'start' && (
        <>
          {google && <a className="socialBtn google" href="/api/account/oauth/google"><GoogleIcon /><span>{t(signup ? 'Sign up with Google' : 'Log in with Google')}</span></a>}
          {facebook && <a className="socialBtn facebook" href="/api/account/oauth/facebook"><FacebookIcon /><span>{t(signup ? 'Sign up with Facebook' : 'Log in with Facebook')}</span></a>}
          {(google || facebook) && <div className="orLine"><span>{t('or')}</span></div>}
          <button className="socialBtn" onClick={() => { setErr(''); setStep('email'); }}><span>{t(signup ? 'Sign up with Email' : 'Log in with Email')}</span></button>
        </>
      )}

      {step === 'email' && (
        <form onSubmit={sendCode} className="loginForm">
          <label>{t('Email')}<input type="email" name="email" required autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <p className="muted small">{t('We’ll e-mail you a 6-digit code. No password needed.')}</p>
          <button className="btn btn-lg btn-block" disabled={busy}>{t('Send code')}</button>
          <button type="button" className="linkBtn" onClick={() => setStep('start')}>{t('← Other ways to log in')}</button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={verify} className="loginForm">
          <p>{t('We sent a code to {email}. Can’t find it? Check your spam folder and mark the e-mail as “Not spam”, so our e-mails reach your inbox next time.', { email })}</p>
          <label>{t('6-digit code')}<input name="code" required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} className="codeInput" /></label>
          <button className="btn btn-lg btn-block" disabled={busy}>{t(verb)}</button>
          <button type="button" className="linkBtn" onClick={() => { setErr(''); setStep('email'); }}>{t('Use another e-mail or send a new code')}</button>
        </form>
      )}

      {err && <p className="err loginErr" role="alert">{err}</p>}
      <p className="muted small loginNote">{t('Log in with the same e-mail you use when ordering to see all your orders.')}</p>
    </div>
  );
}

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from './db';
import { checkHash, makeToken, same, validToken } from './auth';

export const adminEmail = () => (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

/** The single admin row, created on first use. */
export function adminAccount() {
  return db.adminAccount.upsert({ where: { id: 'admin' }, update: {}, create: { id: 'admin' } });
}

/** A password set through "Forgot password" replaces ADMIN_PASSWORD from the server settings. */
export async function checkAdminLogin(email: string, password: string) {
  const acc = await adminAccount();
  const emailOk = same(email.trim().toLowerCase(), adminEmail());
  const pwOk = acc.passwordHash ? checkHash(password, acc.passwordHash) : same(password, process.env.ADMIN_PASSWORD || '');
  return emailOk && pwOk ? acc : null;
}

/** JSON response that signs the admin in. */
export function signedIn(version: number) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('gsm-admin', makeToken(version), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1', maxAge: 12 * 3600, path: '/' });
  return res;
}

export async function isAdmin() {
  const t = (await cookies()).get('gsm-admin')?.value;
  if (!t) return false;
  return validToken(t, (await adminAccount()).passwordVersion);
}
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('UNAUTHORIZED');
}
export function adminError(e: any) {
  const unauth = e?.message === 'UNAUTHORIZED';
  const msg = e?.issues?.[0]?.message || (e?.code === 'P2002' ? 'That name or code already exists' : e?.message);
  return Response.json({ error: unauth ? 'Unauthorized' : msg || 'Request failed' }, { status: unauth ? 401 : 400 });
}
export const cents = (v: unknown) => Math.round(Number(v || 0) * 100);
export const optCents = (v: unknown) => (v === '' || v == null ? null : Math.round(Number(v) * 100));
export const optDate = (v: unknown) => (v ? new Date(String(v)) : null);
export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item';

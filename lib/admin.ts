import { cookies } from 'next/headers';
import { validToken } from './auth';

export async function isAdmin() {
  const c = await cookies();
  return validToken(c.get('gsm-admin')?.value);
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

import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/customer';

export async function POST() {
  return clearSession(NextResponse.json({ ok: true }));
}

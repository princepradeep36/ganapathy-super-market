import crypto from 'crypto';
import type { Prisma } from '@prisma/client';

/** Customer-facing order number: 8 digits, easy to read out on the phone. */
export const orderNo = (o: { id: string; number?: number | null }) => (o.number ? String(o.number) : o.id.slice(-8).toUpperCase());

/** A random, unused 8-digit number (10000000–99999999). */
export async function newOrderNumber(tx: Prisma.TransactionClient) {
  for (let i = 0; i < 10; i++) {
    const n = crypto.randomInt(10_000_000, 100_000_000);
    if (!(await tx.order.findUnique({ where: { number: n }, select: { id: true } }))) return n;
  }
  throw new Error('Could not create an order number, please try again');
}

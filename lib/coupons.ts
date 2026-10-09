import type { Coupon } from '@prisma/client';

/** Validates a coupon against a subtotal and returns the discount in öre. Throws a friendly error. */
export function couponDiscount(c: Coupon | null, subtotal: number, hasItemDiscount: boolean, now = new Date()) {
  if (!c || !c.active) throw new Error('This code is not valid');
  if (c.startsAt && now < c.startsAt) throw new Error('This code is not active yet');
  if (c.endsAt && now > c.endsAt) throw new Error('This code has expired');
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) throw new Error('This code has been fully used');
  if (subtotal < c.minOrder) throw new Error(`Add ${((c.minOrder - subtotal) / 100).toFixed(2)} kr more to use this code`);
  if (!c.stackWithSales && hasItemDiscount) throw new Error('This code cannot be combined with items already on offer');
  let discount = c.type === 'PERCENT' ? Math.floor((subtotal * c.value) / 100) : c.value;
  if (c.maxDiscount != null) discount = Math.min(discount, c.maxDiscount);
  return Math.max(0, Math.min(discount, subtotal));
}

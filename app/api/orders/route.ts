import { z } from 'zod';
import type { Coupon } from '@prisma/client';
import { db } from '@/lib/db';
import { activeSalePrice } from '@/lib/pricing';
import { couponDiscount } from '@/lib/coupons';
import { deliveryFeeFor, inDeliveryArea, store } from '@/lib/config';
import { queueMail, sendOrderPlaced } from '@/lib/email';
import { clientIp, rateLimit } from '@/lib/ratelimit';

const S = z
  .object({
    customerName: z.string().trim().min(2, 'Please enter your name').max(100),
    email: z.email('Please enter a valid email'),
    phone: z.string().trim().min(6, 'Please enter a valid phone number').max(30),
    address: z.string().trim().max(200).default(''),
    postalCode: z.string().trim().max(20).default(''),
    city: z.string().trim().max(80).default(''),
    deliveryMethod: z.enum(['PICKUP', 'DELIVERY']),
    deliverySlot: z.string().trim().max(60).optional().default(''),
    notes: z.string().trim().max(500).optional().default(''),
    paymentMethod: z.enum(['PAY_AT_PICKUP', 'PAY_ON_DELIVERY', 'SWISH']).default('PAY_AT_PICKUP'),
    couponCode: z.string().nullable().optional(),
    items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(50) })).min(1, 'Your basket is empty').max(100),
  })
  .refine((d) => d.deliveryMethod === 'PICKUP' || (d.address.length >= 3 && d.postalCode.length >= 3 && d.city.length >= 2), {
    message: 'Please enter your full delivery address',
  });

export async function POST(req: Request) {
  try {
    if (!rateLimit('order:' + clientIp(req), 10, 10 * 60_000)) throw new Error('Too many orders in a short time. Please call the store.');
    const d = S.parse(await req.json());
    const ids = d.items.map((x) => x.productId);
    if (new Set(ids).size !== ids.length) throw new Error('Duplicate products in basket');
    const products = await db.product.findMany({ where: { id: { in: ids }, active: true } });
    if (products.length !== ids.length) throw new Error('A product in your basket is no longer available. Please refresh.');

    const now = new Date();
    let originalSubtotal = 0, subtotalAfterItemDisc = 0;
    const items = d.items.map((i) => {
      const p = products.find((x) => x.id === i.productId)!;
      if (p.stock < i.quantity) throw new Error(`Only ${p.stock} × ${p.name} left in stock`);
      const unitPrice = activeSalePrice(p, now) ?? p.price;
      originalSubtotal += p.price * i.quantity;
      subtotalAfterItemDisc += unitPrice * i.quantity;
      return { productId: p.id, name: p.name, regularUnitPrice: p.price, unitPrice, itemDiscount: (p.price - unitPrice) * i.quantity, quantity: i.quantity };
    });
    const itemDiscountTotal = originalSubtotal - subtotalAfterItemDisc;
    if (d.deliveryMethod === 'DELIVERY' && !inDeliveryArea(d.postalCode, store.deliveryPrefixes))
      throw new Error(`We only deliver within ${store.deliveryArea}. Please choose store pickup.`);
    if (d.deliveryMethod === 'DELIVERY' && subtotalAfterItemDisc < store.minDeliveryOrder)
      throw new Error(`Minimum order for delivery is ${(store.minDeliveryOrder / 100).toFixed(0)} kr`);

    let coupon: Coupon | null = null;
    let orderDiscountTotal = 0;
    if (d.couponCode) {
      coupon = await db.coupon.findUnique({ where: { code: d.couponCode.trim().toUpperCase() } });
      orderDiscountTotal = couponDiscount(coupon, subtotalAfterItemDisc, itemDiscountTotal > 0, now);
    }
    const afterDiscounts = subtotalAfterItemDisc - orderDiscountTotal;
    const deliveryFee = deliveryFeeFor(d.deliveryMethod, afterDiscounts);
    const total = afterDiscounts + deliveryFee;

    const order = await db.$transaction(async (tx) => {
      for (const i of items) {
        const u = await tx.product.updateMany({ where: { id: i.productId, stock: { gte: i.quantity } }, data: { stock: { decrement: i.quantity } } });
        if (u.count !== 1) throw new Error('Stock just changed. Please review your basket and try again.');
      }
      if (coupon) {
        // Guard the usage limit inside the transaction to avoid over-redemption.
        const c: Coupon = coupon;
        const u = await tx.coupon.updateMany({
          where: c.usageLimit != null ? { id: c.id, usedCount: { lt: c.usageLimit } } : { id: c.id },
          data: { usedCount: { increment: 1 } },
        });
        if (u.count !== 1) throw new Error('This code has just been fully used');
      }
      return tx.order.create({
        data: {
          customerName: d.customerName, email: d.email, phone: d.phone,
          address: d.deliveryMethod === 'DELIVERY' ? d.address : '',
          postalCode: d.deliveryMethod === 'DELIVERY' ? d.postalCode : '',
          city: d.deliveryMethod === 'DELIVERY' ? d.city : '',
          deliveryMethod: d.deliveryMethod, deliverySlot: d.deliverySlot || null, notes: d.notes || null,
          paymentMethod: d.paymentMethod,
          originalSubtotal, itemDiscountTotal, subtotalAfterItemDisc,
          couponCode: coupon?.code ?? null, orderDiscountTotal, deliveryFee, total,
          items: { create: items },
        },
        include: { items: true },
      });
    });
    // Confirmation to the customer + new-order alert to the store (automatic, in the background).
    queueMail(() => sendOrderPlaced(order));
    return Response.json({ id: order.id });
  } catch (e: any) {
    return Response.json({ error: e?.issues?.[0]?.message || e?.message || 'Invalid order' }, { status: 400 });
  }
}

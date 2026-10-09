import { z } from 'zod';

const money = z.coerce.number().min(0, 'Price cannot be negative').max(1_000_000);
const optMoney = z.union([z.literal(''), z.null(), z.undefined(), money]).transform((v) => (v === '' || v == null ? null : Math.round(Number(v) * 100)));
const optDate = z.union([z.literal(''), z.null(), z.undefined(), z.string()]).transform((v) => (v ? new Date(v) : null));

const Product = z.object({
  name: z.string().trim().min(2, 'Product name is required').max(120),
  description: z.string().trim().max(2000).default(''),
  unit: z.string().trim().max(40).optional().transform((v) => v || null),
  categoryId: z.string().min(1, 'Choose a category'),
  price: money.transform((v) => Math.round(v * 100)),
  salePrice: optMoney,
  saleStart: optDate,
  saleEnd: optDate,
  stock: z.coerce.number().int().min(0).max(100000).default(0),
  image: z.string().trim().max(300).default('🛒').transform((v) => v || '🛒'),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export function productInput(raw: unknown) {
  const d = Product.parse(raw);
  if (d.salePrice != null && d.salePrice >= d.price) throw new Error('Offer price must be lower than the regular price');
  if (d.saleStart && d.saleEnd && d.saleEnd <= d.saleStart) throw new Error('Offer end must be after the start');
  return d;
}

const Coupon = z.object({
  name: z.string().trim().min(2, 'Campaign name is required').max(80),
  code: z.string().trim().min(3, 'Code must be at least 3 characters').max(30).transform((v) => v.toUpperCase().replace(/\s+/g, '')),
  type: z.enum(['PERCENT', 'FIXED']).default('PERCENT'),
  value: z.coerce.number().positive('Discount value must be above 0'),
  minOrder: z.union([z.literal(''), z.null(), z.undefined(), money]).transform((v) => (v === '' || v == null ? 0 : Math.round(Number(v) * 100))),
  maxDiscount: optMoney,
  startsAt: optDate,
  endsAt: optDate,
  usageLimit: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(1)]).transform((v) => (v === '' || v == null ? null : Number(v))),
  stackWithSales: z.boolean().default(true),
  active: z.boolean().default(true),
});

export function couponInput(raw: unknown) {
  const d = Coupon.parse(raw);
  if (d.type === 'PERCENT' && d.value > 90) throw new Error('Percentage discount cannot be above 90%');
  return { ...d, value: d.type === 'FIXED' ? Math.round(d.value * 100) : Math.round(d.value) };
}

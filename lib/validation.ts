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
  collectionIds: z.array(z.string()).max(50).default([]),
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

const Collection = z.object({
  name: z.string().trim().min(2, 'Collection name is required').max(60),
  icon: z.string().trim().max(8).default('✨').transform((v) => v || '✨'),
  description: z.string().trim().max(300).default(''),
  active: z.boolean().default(true),
  startsAt: optDate.optional(),
  endsAt: optDate.optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export function collectionInput(raw: unknown) {
  const d = Collection.parse(raw);
  if (d.startsAt && d.endsAt && d.endsAt <= d.startsAt) throw new Error('End date must be after the start');
  return d;
}

const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
const Request = z.object({
  productName: z.string().trim().min(2, 'Tell us which product you are looking for').max(120),
  details: optText(500),
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  phone: optText(30),
  email: z.union([z.literal(''), z.string().trim().email('Please enter a valid e-mail')]).optional().transform((v) => v || null),
});

export function requestInput(raw: unknown) {
  const d = Request.parse(raw);
  if (!d.phone && !d.email) throw new Error('Add a phone number or e-mail so we can reply');
  return d;
}

const Banner = z.object({
  image: z.string().trim().regex(/^\/uploads\/[\w.-]+$/, 'Upload a banner image'),
  title: z.string().trim().min(2, 'Add a short description of the banner').max(120),
  // Where a click goes: a page in the shop (/shop?col=diwali-2026) or a full https:// address.
  link: z.union([z.literal(''), z.string().trim().max(300).regex(/^(\/(?!\/)|https:\/\/)/, 'Link must start with / or https://')]).optional().transform((v) => v || null),
  active: z.boolean().default(true),
  startsAt: optDate.optional(),
  endsAt: optDate.optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export function bannerInput(raw: unknown) {
  const d = Banner.parse(raw);
  if (d.startsAt && d.endsAt && d.endsAt <= d.startsAt) throw new Error('End date must be after the start');
  return d;
}

const SLOT = /^([01]?\d|2[0-3])[:.][0-5]\d\s*[–-]\s*([01]?\d|2[0-3])[:.][0-5]\d$/;
const Schedule = z.object({
  days: z.array(z.coerce.number().int().min(0).max(6)).max(7),
  slots: z.array(z.string().trim().regex(SLOT, 'Write times like 10:00–12:00')).max(20),
  cutoffMinutes: z.coerce.number().int().min(0, 'Cut-off cannot be negative').max(7 * 1440),
  daysAhead: z.coerce.number().int().min(1, 'Show at least 1 day').max(14, 'Show at most 14 days'),
  closedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(100),
  allowAsap: z.boolean(),
});

export function scheduleInput(raw: unknown) {
  const d = Schedule.parse(raw);
  // Normalise "10.00-12.00" to "10:00–12:00", keep the order the admin chose, drop duplicates.
  const slots = [...new Set(d.slots.map((s) => s.replace(/\./g, ':').replace(/\s*[–-]\s*/, '–')))];
  return { ...d, slots, days: [...new Set(d.days)].sort(), closedDates: [...new Set(d.closedDates)].sort() };
}

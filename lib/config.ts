// Store settings come from environment variables so the shop owner can change
// them in .env / docker-compose without touching code. Amounts are in öre.
const int = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
};

export const store = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || 'Ganapathy Super Market',
  phone: process.env.STORE_PHONE || '073-577 35 60',
  email: process.env.STORE_EMAIL || '',
  address: process.env.STORE_ADDRESS || 'Gasverksgatan 13, 252 18 Helsingborg',
  hours: process.env.STORE_HOURS || 'Open every day 09:00–20:30',
  mapUrl: process.env.STORE_MAP_URL || 'https://maps.app.goo.gl/aZpgWBusAx839gkP7',
  swish: process.env.SWISH_NUMBER || '',
  whatsappGroup: process.env.WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/GFdOTb2ZFVh4S2pxpiQXBr',
  // Company details shown in the footer.
  legalName: process.env.COMPANY_NAME || 'Ganapathy Supermarket AB',
  orgNumber: process.env.COMPANY_ORG_NUMBER || '559131-5956',
  textfreeNumber: process.env.COMPANY_TEXTFREE_NUMBER || 'SE559131595601',
  deliveryFee: int(process.env.DELIVERY_FEE_ORE, 4900),
  freeDeliveryMin: int(process.env.FREE_DELIVERY_MIN_ORE, 49900),
  minDeliveryOrder: int(process.env.MIN_DELIVERY_ORDER_ORE, 19900),
  lowStock: int(process.env.LOW_STOCK_THRESHOLD, 10),
  // Home delivery is only offered inside this area; everyone else picks up in store.
  deliveryArea: process.env.DELIVERY_AREA || 'Helsingborg',
  // Postal codes that count as the delivery area (first 3 digits). Helsingborg = 250–256.
  deliveryPrefixes: (process.env.DELIVERY_POSTCODE_PREFIXES || '250,251,252,253,254,255,256').split(',').map((s) => s.trim()).filter(Boolean),
};

/** Phone in international format for tel: links, e.g. 073-577 35 60 → +46735773560. */
export const telHref = () => {
  const d = store.phone.replace(/[^\d+]/g, '');
  return 'tel:' + (d.startsWith('+') ? d : d.startsWith('0') ? '+46' + d.slice(1) : d);
};
/** Google Maps embed for the store address (no API key needed). */
export const mapEmbed = () => 'https://www.google.com/maps?output=embed&q=' + encodeURIComponent(store.name + ', ' + store.address);

/** The subset that is safe and useful to send to the browser. */
export const publicStore = () => ({
  name: store.name,
  phone: store.phone,
  swish: store.swish,
  deliveryFee: store.deliveryFee,
  freeDeliveryMin: store.freeDeliveryMin,
  minDeliveryOrder: store.minDeliveryOrder,
  deliveryArea: store.deliveryArea,
  deliveryPrefixes: store.deliveryPrefixes,
});
export type PublicStore = ReturnType<typeof publicStore>;

/** True when a Swedish postal code is inside the delivery area (shared by browser and server). */
export function inDeliveryArea(postalCode: string, prefixes: string[]) {
  const digits = String(postalCode || '').replace(/\D/g, '');
  return digits.length === 5 && prefixes.some((p) => digits.startsWith(p));
}

export function deliveryFeeFor(method: string, subtotal: number) {
  if (method !== 'DELIVERY') return 0;
  return subtotal >= store.freeDeliveryMin ? 0 : store.deliveryFee;
}

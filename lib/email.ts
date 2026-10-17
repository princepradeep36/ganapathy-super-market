// Automatic order e-mails via Gmail (or any SMTP server). Free with a Gmail
// "app password" — up to ~500 e-mails per day.
//
// Sent automatically:
//   • order placed      → customer confirmation + new-order alert to the store
//   • ready / delivered → customer update   • cancelled → customer notice
//
// If SMTP is not configured nothing is sent and the shop keeps working.
import { store } from './config';
import { customerStatusLabel } from './status';

type Item = { name: string; quantity: number; unitPrice: number; regularUnitPrice: number };
export type MailOrder = {
  id: string; customerName: string; email: string; phone: string; address: string; postalCode: string; city: string;
  deliveryMethod: string; deliverySlot: string | null; notes: string | null; paymentMethod: string; status: string;
  originalSubtotal: number; itemDiscountTotal: number; couponCode: string | null; orderDiscountTotal: number;
  deliveryFee: number; total: number; createdAt: Date; items: Item[];
};

const env = (k: string) => (process.env[k] || '').trim();
export const mailConfig = () => ({
  user: env('SMTP_USER'),
  pass: env('SMTP_PASS').replace(/\s+/g, ''), // Gmail shows app passwords with spaces
  host: env('SMTP_HOST') || 'smtp.gmail.com',
  port: Number(env('SMTP_PORT')) || 465,
  storeInbox: env('STORE_ORDER_EMAIL') || env('SMTP_USER'),
  siteUrl: (env('SITE_URL') || 'http://localhost:3000').replace(/\/$/, ''),
});
export const mailEnabled = () => { const c = mailConfig(); return !!(c.user && c.pass); };

let transport: Promise<{ sendMail: (m: any) => Promise<unknown> }> | null = null;
async function getTransport() {
  if (!transport) {
    const c = mailConfig();
    transport = import('nodemailer').then((m) =>
      m.default.createTransport({ host: c.host, port: c.port, secure: c.port === 465, auth: { user: c.user, pass: c.pass }, pool: true, maxConnections: 2 }),
    );
  }
  return transport;
}

async function send(to: string, subject: string, html: string, text: string, replyTo?: string) {
  if (!mailEnabled() || !to) return;
  const c = mailConfig();
  const t = await getTransport();
  // Retry once — Gmail occasionally drops a connection.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await t.sendMail({ from: `"${store.name}" <${c.user}>`, to, subject, html, text, replyTo });
      return;
    } catch (e: any) {
      if (attempt === 2) console.error(`[email] could not send "${subject}" to ${to}:`, e?.message || e);
      else await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

/** Fire-and-forget: never blocks or fails the order itself. */
export function queueMail(job: () => Promise<unknown>) {
  if (!mailEnabled()) return;
  job().catch((e) => console.error('[email]', e?.message || e));
}

// ---------- templates ----------
const kr = (ore: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(ore / 100);
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
export const orderRef = (id: string) => id.slice(-8).toUpperCase();
const PAY: Record<string, string> = { PAY_AT_PICKUP: 'Pay at pickup', PAY_ON_DELIVERY: 'Pay on delivery', SWISH: 'Swish' };

function layout(title: string, body: string) {
  const c = mailConfig();
  return `<!doctype html><html><body style="margin:0;background:#f3f5f1;font-family:Segoe UI,Arial,sans-serif;color:#15231b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f1;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e8e1">
<tr><td style="background:#07432a;padding:20px 24px">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td><img src="${c.siteUrl}/brand/logo.png" width="52" height="52" alt="" style="display:block;border-radius:50%"></td>
    <td style="padding-left:12px;color:#fff;font-size:20px;font-weight:800;line-height:1.1">Tamil<span style="color:#ffb020">Kadai</span><br><span style="font-size:12px;color:#ffb020">தமிழ் கடை</span></td>
  </tr></table>
</td></tr>
<tr><td style="padding:26px 24px 8px"><h1 style="margin:0 0 6px;font-size:22px;color:#07432a">${title}</h1>${body}</td></tr>
<tr><td style="padding:18px 24px 24px;color:#6b7a71;font-size:12px;border-top:1px solid #eef0ec">
  ${esc(store.name)} · ${esc(store.address)}<br>${esc(store.hours)} · ${esc(store.phone)}
</td></tr></table></td></tr></table></body></html>`;
}

function details(o: MailOrder) {
  const delivery = o.deliveryMethod === 'DELIVERY';
  const rows = o.items.map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f2ed">${i.quantity} × ${esc(i.name)}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #f0f2ed;white-space:nowrap">${kr(i.unitPrice * i.quantity)}</td></tr>`).join('');
  const line = (l: string, v: string, green = false) => `<tr><td style="padding:4px 0;${green ? 'color:#1d7f46' : ''}">${l}</td><td align="right" style="padding:4px 0;${green ? 'color:#1d7f46' : ''}">${v}</td></tr>`;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f3;border-radius:12px;margin:16px 0;font-size:14px"><tr><td style="padding:14px 16px">
  <b>Order #${orderRef(o.id)}</b> · ${o.createdAt.toLocaleString('sv-SE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Stockholm' })}<br>
  ${delivery ? `🚚 Home delivery to <b>${esc(o.address)}, ${esc(o.postalCode)} ${esc(o.city)}</b>` : `🏪 Store pickup at <b>${esc(store.address)}</b>`}<br>
  🕘 ${esc(o.deliverySlot || 'As soon as possible')} · 💳 ${PAY[o.paymentMethod] || esc(o.paymentMethod)}
  ${o.notes ? `<br>📝 “${esc(o.notes)}”` : ''}
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px">
  ${line('Items', kr(o.originalSubtotal))}
  ${o.itemDiscountTotal ? line('Offer savings', '−' + kr(o.itemDiscountTotal), true) : ''}
  ${o.orderDiscountTotal ? line('Code ' + esc(o.couponCode), '−' + kr(o.orderDiscountTotal), true) : ''}
  ${line(delivery ? 'Delivery' : 'Pickup', o.deliveryFee ? kr(o.deliveryFee) : 'Free')}
  <tr><td style="padding:10px 0 0;border-top:1px solid #e4e8e1;font-size:18px;font-weight:800">Total</td><td align="right" style="padding:10px 0 0;border-top:1px solid #e4e8e1;font-size:18px;font-weight:800">${kr(o.total)}</td></tr>
</table>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:20px 0 4px"><a href="${href}" style="display:inline-block;background:#0b5d3b;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">${label}</a></p>`;

function plain(o: MailOrder) {
  return [
    `Order #${orderRef(o.id)}`,
    ...o.items.map((i) => `${i.quantity} x ${i.name} — ${kr(i.unitPrice * i.quantity)}`),
    `Total: ${kr(o.total)}`,
    o.deliveryMethod === 'DELIVERY' ? `Delivery to: ${o.address}, ${o.postalCode} ${o.city}` : `Pickup at: ${store.address}`,
    `Time: ${o.deliverySlot || 'As soon as possible'}`,
    `Customer: ${o.customerName}, ${o.phone}, ${o.email}`,
    o.notes ? `Notes: ${o.notes}` : '',
  ].filter(Boolean).join('\n');
}

export function customerConfirmation(o: MailOrder) {
  const c = mailConfig();
  const first = esc(o.customerName.split(' ')[0]);
  const html = layout(`Thank you, ${first}! 🙏`, `
<p style="margin:0;font-size:15px;color:#3b4a41">We’ve received your order and will start preparing it. We’ll contact you on <b>${esc(o.phone)}</b> if anything needs confirming.</p>
${details(o)}
${button(`${c.siteUrl}/order/${o.id}`, 'Track your order')}
<p style="font-size:13px;color:#6b7a71">Questions? Just reply to this e-mail or call ${esc(store.phone)}.</p>`);
  return { subject: `Order confirmed #${orderRef(o.id)} · ${store.name}`, html, text: `Thank you for your order!\n\n${plain(o)}\n\nTrack: ${c.siteUrl}/order/${o.id}` };
}

export function storeAlert(o: MailOrder) {
  const c = mailConfig();
  const html = layout(`🛒 New order — ${kr(o.total)}`, `
<p style="margin:0;font-size:15px;color:#3b4a41"><b>${esc(o.customerName)}</b> · <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a> · <a href="mailto:${esc(o.email)}">${esc(o.email)}</a></p>
${details(o)}
${button(`${c.siteUrl}/admin?tab=orders#${o.id}`, 'Open in admin')}`);
  const kind = o.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup';
  return { subject: `🛒 New order #${orderRef(o.id)} · ${kr(o.total)} · ${kind} · ${o.customerName}`, html, text: `New order\n\n${plain(o)}\n\nAdmin: ${c.siteUrl}/admin?tab=orders` };
}

export function statusUpdate(o: MailOrder) {
  const c = mailConfig();
  const label = customerStatusLabel(o.status, o.deliveryMethod);
  const msg: Record<string, string> = {
    READY: o.deliveryMethod === 'DELIVERY' ? 'Your groceries are on the way! 🚚' : `Your order is ready for pickup at ${esc(store.address)}. 🏪`,
    COMPLETED: 'Thank you for shopping with us — we hope to see you again soon!',
    CANCELLED: `Your order has been cancelled. If this is unexpected, please call us on ${esc(store.phone)}.`,
  };
  const html = layout(label, `<p style="margin:0;font-size:15px;color:#3b4a41">${msg[o.status] || ''}</p>${details(o)}${button(`${c.siteUrl}/order/${o.id}`, 'View order')}`);
  return { subject: `${label} · order #${orderRef(o.id)} · ${store.name}`, html, text: `${label}\n\n${plain(o)}` };
}

/** Called right after an order is created. */
export async function sendOrderPlaced(o: MailOrder) {
  const c = mailConfig();
  const a = customerConfirmation(o), b = storeAlert(o);
  await Promise.all([
    send(o.email, a.subject, a.html, a.text, c.storeInbox),
    send(c.storeInbox, b.subject, b.html, b.text, o.email),
  ]);
}

/** Customers are told when their order is ready/out for delivery or cancelled. */
export const NOTIFY_STATUSES = ['READY', 'CANCELLED'];
export async function sendStatusUpdate(o: MailOrder) {
  if (!NOTIFY_STATUSES.includes(o.status)) return;
  const m = statusUpdate(o);
  await send(o.email, m.subject, m.html, m.text, mailConfig().storeInbox);
}

/** Tells the store a customer asked for a product it doesn't stock. */
export async function sendProductRequest(r: { productName: string; details: string | null; name: string; phone: string | null; email: string | null }) {
  const c = mailConfig();
  const contact = [r.phone && `<a href="tel:${esc(r.phone)}">${esc(r.phone)}</a>`, r.email && `<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>`].filter(Boolean).join(' · ');
  const html = layout(`🙋 Product request: ${esc(r.productName)}`, `
<p style="margin:0;font-size:15px;color:#3b4a41"><b>${esc(r.name)}</b> · ${contact}</p>
${r.details ? `<p style="font-size:15px;color:#3b4a41">${esc(r.details)}</p>` : ''}
${button(`${c.siteUrl}/admin?tab=requests`, 'Open requests in admin')}`);
  const text = `Product request: ${r.productName}\n${r.details || ''}\nFrom: ${r.name} ${r.phone || ''} ${r.email || ''}`;
  await send(c.storeInbox, `🙋 Product request: ${r.productName}`, html, text, r.email || undefined);
}

/**
 * One-time link for the admin to choose a new password. With `loginEmail` it is a
 * "forgot my sign-in e-mail" reminder and also tells them which address to sign in with.
 */
export async function sendAdminReset(to: string, token: string, minutes: number, loginEmail?: string) {
  const c = mailConfig();
  const link = `${c.siteUrl}/admin/reset?token=${encodeURIComponent(token)}`;
  const title = loginEmail ? 'Your admin sign-in details' : 'Reset your admin password';
  const intro = loginEmail
    ? `Someone asked for the sign-in details of the ${esc(store.name)} store admin.</p><p style="font-size:15px;color:#3b4a41">Sign-in e-mail: <b>${esc(loginEmail)}</b></p><p style="font-size:15px;color:#3b4a41">Forgot the password as well? Use the button below. It works once, for ${minutes} minutes.`
    : `Someone asked to reset the password for the ${esc(store.name)} store admin. The link works once, for ${minutes} minutes.`;
  const html = layout(title, `
<p style="margin:0;font-size:15px;color:#3b4a41">${intro}</p>
${button(link, 'Choose a new password')}
<p style="font-size:13px;color:#6b7a71">If you didn’t ask for this, ignore this e-mail; nothing changes.</p>`);
  const text = `${title}\n\n${loginEmail ? `Sign-in e-mail: ${loginEmail}\n\n` : ''}Choose a new password (valid ${minutes} minutes):\n${link}\n\nIf you didn't ask for this, ignore this e-mail.`;
  await send(to, `${title} · ${store.name}`, html, text);
}

# Ganapathy Super Market — web store

Next.js 15 + PostgreSQL + Prisma, packaged with Docker. One small server runs the shop, the admin and the database — no paid SaaS needed.

## What customers get

- **Fast, app-like shop** (inspired by Blinkit / Instamart / Weee!): sticky search, category bar, offer badges, "Only 3 left" hints.
- **One-tap Add → − 1 + stepper** on every product card, plus a slide-in **basket drawer** with a free-delivery progress bar.
- **Shop page** with category filter, "On offer" / "In stock" filters and sorting (price, discount, A–Z). Search covers name, description and category.
- **Product pages** with pack size, savings, stock status and related products.
- **Checkout in 3 steps**: pickup or delivery (with time slot), contact details, payment (pay at pickup / on delivery, optional Swish). Customer details are remembered on the device. Prices and stock are refreshed from the server when checkout opens.
- **Order tracking page** (New → Confirmed → Packed → Ready / Out for delivery → Completed) and **My orders** — no account needed. Orders can also be found with order number + phone.
- **Mobile first**: bottom tab bar, sticky "View basket" bar, 2-column product grid.

## What the shop owner gets (`/admin`)

- **Overview**: today's sales, orders waiting, 30-day revenue and average basket, low-stock count, 14-day sales chart, best sellers, new orders and restock list. Refreshes every minute.
- **Orders**: filter (To handle / New / Completed / Cancelled), search, one-click "next step" button, mark paid, cancel (puts stock back and frees the coupon use), call / WhatsApp / email the customer, printable **packing slip**, **CSV export** for bookkeeping.
- **Products**: search & filters (visible, low stock, on offer, hidden), quick **stock − / +** and inline edit, show/hide switch, edit form with photo upload or emoji icon, pack size, scheduled offers, "feature on homepage".
- **Categories**: icon, name, display order.
- **Coupons**: percentage or fixed, minimum basket, max discount, dates, usage limit, live/scheduled/expired status and usage meter.

## Run with Docker

1. Copy `.env.example` to `.env`, set a strong `ADMIN_PASSWORD` and `SESSION_SECRET` (`openssl rand -hex 32`), and fill in the store details.
2. Start:

   ```powershell
   docker compose up --build -d
   ```

3. Shop: http://localhost:3000 · Admin: http://localhost:3000/admin/login

On start the container runs `prisma db push` (adds the new columns without deleting data) and the seed. The seed only adds demo products when the shop is **empty**, so your real catalogue is never touched. Existing categories get icons.

**Do not** run `docker compose down -v` — that deletes the database and uploaded photos.

## Settings (`.env`)

| Variable | Meaning | Default |
|---|---|---|
| `STORE_PHONE`, `STORE_EMAIL`, `STORE_ADDRESS`, `STORE_HOURS` | Shown in header, footer, checkout | demo values |
| `SWISH_NUMBER` | Shows a "Swish now" payment option | empty (hidden) |
| `DELIVERY_FEE_ORE` | Delivery fee in öre | 4900 (49 kr) |
| `FREE_DELIVERY_MIN_ORE` | Free delivery above | 49900 (499 kr) |
| `MIN_DELIVERY_ORDER_ORE` | Minimum basket for delivery | 19900 (199 kr) |
| `LOW_STOCK_THRESHOLD` | "Low stock" warning level | 10 |
| `INSECURE_COOKIES` | `1` allows admin login over plain http (local testing). Set `0` once you use HTTPS | 1 in compose |

## Automatic order e-mails (free, via Gmail)

When an order is placed, two e-mails go out automatically — no manual step:

- **Customer**: "Order confirmed" with items, total, pickup/delivery details and a "Track your order" button.
- **Store**: "New order" alert with customer name, phone, address, notes and an "Open in admin" button. Replying goes straight to the customer.

Customers also get an e-mail when the order is marked **Ready / Out for delivery** or **Cancelled**.

Setup (5 minutes):
1. Use a Gmail account for the shop and turn on **2-Step Verification**.
2. Go to https://myaccount.google.com/apppasswords, create an app password named "Shop".
3. In `.env` set `SMTP_USER` (the Gmail address), `SMTP_PASS` (the 16-letter app password), optionally `STORE_ORDER_EMAIL` (where alerts go) and `SITE_URL` (your public web address).
4. `docker compose up --build -d`

Gmail allows ~500 e-mails/day for free. If e-mail is not configured, the shop still works — it just skips the e-mails. Send problems are logged: `docker compose logs web | findstr email`.

## Delivery area

Home delivery is only offered within **Helsingborg** (postal codes 250xx–256xx). Customers outside it see a message and are asked to choose free store pickup; the server enforces the same rule. Change with `DELIVERY_AREA` and `DELIVERY_POSTCODE_PREFIXES`.

## Low-cost, reliable hosting

- A single small VPS (e.g. Hetzner CX22 / DigitalOcean 2 GB, ~50–70 kr/month) runs everything with `docker compose`.
- Put **Caddy** or Cloudflare in front for free HTTPS, then set `INSECURE_COOKIES=0`.
- The compose file includes a **nightly database backup** into `./backups` (kept 14 days) — copy that folder off the server now and then.
- `/api/health` is used by the Docker health check and works with free uptime monitors (UptimeRobot, Better Stack).
- Rate limits protect admin login, coupon guessing and order spam without extra services.

## Before commercial launch

- Online payment is intentionally not enabled (pay at pickup / on delivery, optional manual Swish). Add Swish Handel or Stripe when volumes justify the fees.
- Consider order e-mails/SMS (e.g. Resend free tier or 46elks) — the order page already shows live status.
- Add your terms, privacy policy (GDPR) and returns info pages.

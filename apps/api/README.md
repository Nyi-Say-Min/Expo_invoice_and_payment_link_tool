# API application

Express API for catalog pricing, persistent orders, Stripe Payment Links,
payment status, CSV export, and signed Stripe webhooks.

For the complete project setup and production checklist, see the
[repository README](../../README.md).

## Commands

Run from this directory:

```bash
npm install
npm run dev
npm run build
npm start
npm test
npm run db:migrate
npm run db:generate
npm run db:studio
```

The committed migration is sufficient for a new database. The API refuses to
start when the `orders` table is missing.

## Configuration

The API loads environment variables from `apps/api/.env` or the repository
root `.env`.

| Variable | Default | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Local PostgreSQL URL | Set explicitly for every deployment. |
| `STRIPE_SECRET_KEY` | Empty | Test key required when creating or checking payments. |
| `STRIPE_WEBHOOK_SECRET` | Empty | Required for Stripe webhook verification. |
| `PASSCODE` | Empty | Required in every environment. |
| `APP_MODE` | `test` | Must remain `test`; every other value is rejected. |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated exact origins. |
| `PORT` | `3001` | HTTP listen port. |
| `NODE_ENV` | `development` | Controls production safeguards and DB pool size. |
| `CATALOG_PATH` | Bundled catalog | Optional replacement CSV path. |

## Routes

`GET /health` is public. The Stripe webhook is public but signature protected.
All other `/api` routes always require the configured `x-passcode`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health and active app mode. |
| `GET` | `/api/products` | Catalog and available filters. |
| `POST` | `/api/products/price-preview` | Preview server pricing. |
| `POST` | `/api/orders/preview` | Preview an order total. |
| `POST` | `/api/orders` | Validate, price, and persist an order. |
| `GET` | `/api/orders?page=1&limit=10` | Paginated order history. |
| `GET` | `/api/orders/export.csv` | Export all orders. |
| `POST` | `/api/orders/:id/payment-link` | Create or reuse a Stripe link and QR code. |
| `POST` | `/api/orders/:id/refresh-status` | Query Stripe for a paid Checkout Session. |
| `POST` | `/api/webhooks/stripe` | Verify Stripe events and mark orders paid. |

## Pricing domain

The server is authoritative:

- USD is stored and calculated in integer cents.
- Blonde items add 30% to unit prices.
- Expo discount is 10% and defaults on.
- A total weight of at least 10,000 g triggers the 10% volume discount.
- Volume and expo discounts cannot combine; volume takes precedence.
- CNY is calculated from supplied catalog values and rounded to whole yuan.
- Non-`per_kg` quantities must be whole numbers.
- `per_kg` quantities support up to three decimal places and count as 1,000 g
  per unit.
- A request may contain at most 50 item entries.

## Payment safety

- An order is persisted before its Payment Link is requested.
- Existing stored links are returned instead of recreated.
- Stripe receives a stable idempotency key based on the order ID.
- The application accepts test-mode Stripe keys only and rejects live mode.
- Webhook payloads are processed as raw bytes and verified with the configured
  signing secret.
- Paid states can be recovered by querying Checkout Sessions if a webhook is
  delayed.

Stripe is intentionally sent one aggregate USD line item. Detailed priced
items remain in PostgreSQL for order history, export, and invoices.

## Catalog

The default source is `src/data/trunov_price_list.csv`. Production builds copy
it into `dist/data`.

Required columns:

```text
sku,line,product_type,length_in,unit,pack_weight_g,price_usd,price_cny
```

Supported units:

- `pack_100pcs`
- `pack_20pcs`
- `per_100g`
- `per_kg`
- `pack`

Set `CATALOG_PATH` to load a mounted replacement without changing code, then
restart the API.

## Tests

```bash
npm test
```

The suite covers catalog validation, pricing boundaries and discounts, order
service behavior, and API response mapping.

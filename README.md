# TRUNOV HAIR Expo Invoice & Payment Link Tool

An internal booth application for building hair-extension orders, applying the
correct pricing rules, creating Stripe Payment Links, and tracking payments.
It is designed for fast use on laptops and tablets at the China Hair Expo.

**Live application:** [expo-invoice-and-payment-link-tool.vercel.app](https://expo-invoice-and-payment-link-tool.vercel.app/)

The deployed application and every Stripe integration in this submission are
strictly test mode.

## What is included

- A searchable 75-product CSV catalog with line, type, and length filters.
- A fast order builder with regular and blonde variants.
- Automatic USD and CNY totals, weight calculation, and discounts.
- Minimal customer name and phone, WeChat, or email capture.
- Stripe Payment Links with a scannable QR code.
- Persistent PostgreSQL order history with pending and paid states.
- Signed Stripe webhooks plus a manual status refresh fallback.
- Local browser draft recovery when the connection or page is interrupted.
- Idempotency guards against duplicate Payment Links.
- Order CSV export with spreadsheet-formula-injection protection.
- A printable invoice that can be printed or saved as PDF.
- Responsive laptop and tablet layouts with a sticky navigation bar.

## Stack

- Web: React 19, TypeScript, Vite, Axios
- API: Node.js, Express 5, TypeScript
- Database: PostgreSQL, Drizzle ORM
- Payments: Stripe Payment Links and Checkout webhooks
- Tests: Vitest

## Repository layout

```text
.
|-- apps/
|   |-- api/        Express API, pricing domain, Stripe, PostgreSQL
|   `-- web/        React booth interface
|-- docker-compose.yml
|-- .env.example
`-- package.json    Repository-level verification and database scripts
```

See [apps/api/README.md](apps/api/README.md) and
[apps/web/README.md](apps/web/README.md) for app-specific details.

### Data flow

The React/Vite client calls the Express API with the booth passcode in the
`x-passcode` header. The API recalculates prices from its server-side catalog,
persists orders in PostgreSQL, and creates test-mode Stripe Payment Links.
Stripe sends signed webhook events back to the API, which updates PostgreSQL;
the client-side **Check status** action queries Stripe through the API as a
recovery path when webhook delivery is delayed.

## Prerequisites

- Node.js 22 recommended
- npm
- Docker Desktop or another PostgreSQL 16-compatible server
- A Stripe test account for the complete payment flow
- Stripe CLI for local webhook testing

## Local setup

1. Install both applications:

   ```bash
   npm install --prefix apps/api
   npm install --prefix apps/web
   ```

2. Copy `.env.example` to the repository-root `.env` and replace its API
   placeholder values.

   Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   macOS/Linux:

   ```bash
   cp .env.example .env
   ```

   The API loads this root file. Vite does not: its local default already points
   to `http://localhost:3001`. If a different API URL is needed locally, create
   `apps/web/.env` containing only:

   ```text
   VITE_API_URL=http://localhost:3001
   ```

3. Start PostgreSQL and apply the committed migration:

   ```bash
   docker compose up -d db
   npm run db:migrate
   ```

4. Start the API:

   ```bash
   npm run api:dev
   ```

5. In another terminal, start the web application:

   ```bash
   npm --prefix apps/web run dev
   ```

6. Open `http://localhost:5173`, enter the configured passcode, and create an
   order.

The API runs at `http://localhost:3001` by default. Its health endpoint is
`GET /health`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Deployment | PostgreSQL connection string; a local default is provided. |
| `STRIPE_SECRET_KEY` | For payments | Stripe test or restricted test key (`sk_test_` or `rk_test_`). |
| `STRIPE_WEBHOOK_SECRET` | For webhooks | Stripe signing secret beginning with `whsec_`. |
| `PASSCODE` | Yes | Shared booth passcode; never hardcode it in the web app. |
| `APP_MODE` | Deployment | Must be `test`; any other value is rejected. |
| `CORS_ORIGIN` | Deployment | Allowed web origins; defaults locally to `http://localhost:5173`. |
| `PORT` | No | API port; defaults to `3001`. |
| `NODE_ENV` | Deployment | Use `production` in production. |
| `CATALOG_PATH` | No | Absolute or working-directory-relative path to a replacement catalog CSV. |
| `VITE_API_URL` | Web deployment | Public API base URL; defaults to `http://localhost:3001`. |

`VITE_API_URL` is a Vite build-time setting. Configure it in
`apps/web/.env` for local overrides or in the web hosting environment.

### Stripe key safety

The API enforces the assignment's test-mode-only constraint before use:

- `APP_MODE=test` accepts only `sk_test_` or `rk_test_` keys.
- Any non-test `APP_MODE` is rejected during startup.
- Live Stripe secret keys are rejected.
- Placeholder keys are rejected.
- Startup is rejected when `PASSCODE` is missing.

Never commit `.env`, Stripe keys, webhook secrets, or database credentials.
For deployment, use a restricted test key supplied through the hosting
provider's secret manager. Only `VITE_API_URL` belongs in the Vite environment;
all credentials and the booth passcode remain server-side.

## Local Stripe webhook

With the API running, forward Stripe events:

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

Copy the emitted `whsec_...` value to `STRIPE_WEBHOOK_SECRET`, restart the API,
and complete a test payment. The implementation handles:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

The webhook marks an order paid only after Stripe signature verification. The
Orders screen also provides **Check status** as a recovery path if webhook
delivery is delayed.

## Pricing decisions

USD is the payment source of truth. All Stripe Payment Links charge the final
order total in USD.

CNY is a separately calculated, catalog-based reference total rounded to whole
yuan. It is not a converted Stripe charge or a live exchange-rate quote. Blonde
pricing and discounts are applied to USD and CNY independently.

Rules:

1. Blonde is selected per line item and adds 30% to its unit price.
2. Expo discount is 10% and is enabled by default.
3. Orders weighing at least 10,000 g receive the 10% volume discount.
4. Discounts never stack. Volume takes precedence when its threshold is met.
5. `per_kg` products count as 1,000 g per quantity unit.
6. USD calculations use integer cents.

The API recalculates every order from the server-side catalog. Client totals
are previews only and cannot override stored prices.

## Reliability and unstable connections

- The current draft is saved to browser `localStorage`.
- The UI reports offline state and prevents network-only actions while offline.
- Orders are stored before Stripe link creation, so a Stripe failure does not
  lose the order.
- Retrying reuses the saved order.
- The web client blocks repeated submissions in flight.
- The API reuses an existing link and sends Stripe the stable idempotency key
  `trunov-order-{orderId}-payment-link-v1`.
- A link is saved after Stripe responds. If the network times out after Stripe
  accepts the request but before persistence, retrying uses that same Stripe
  idempotency key instead of creating a duplicate link.
- Orders survive page refreshes and API restarts in PostgreSQL.
- Clear error responses distinguish database and Stripe connectivity failures.

## Catalog replacement

The committed catalog is:

```text
apps/api/src/data/trunov_price_list.csv
```

It must contain exactly these columns:

```text
sku,line,product_type,length_in,unit,pack_weight_g,price_usd,price_cny
```

To update it without code changes, either:

- replace the file before building the API; or
- set `CATALOG_PATH` to a mounted CSV file at runtime.

The API validates required columns, supported units, positive prices and
weights, and duplicate SKUs at startup. Restart the API after replacing the
catalog.

## CSV export and printable invoice

The Orders screen exports all orders with date, order ID, customer, contact,
items, subtotal, applied discount, USD total, and status.

After a Payment Link is created, choose **Print / save PDF**. The browser print
dialog renders a dedicated A4 invoice with placeholder company details, as
allowed by the optional assignment bonus. Paid invoices can be printed
again from **Orders → Actions → Print / Save PDF**.

## Responsive behavior

- Wider laptop and landscape views keep the checkout in the viewport while
  only the product grid scrolls.
- Stacked tablet views use one continuous hidden-scrollbar page so the checkout,
  filters, and complete catalog remain reachable.
- Navigation remains sticky in both modes.

## Verification

Run the complete local quality gate:

```bash
npm run verify
```

This runs API unit tests, the API TypeScript build, web linting, and the web
production build.

Pricing tests cover blonde pricing, the 10 kg boundary, discount precedence,
currency totals, catalog validation, and response mapping.

Latest result on 2026-07-28: 7 test files and 21 tests passed; the API build,
web lint, and web production build also passed.

The final local audit on 2026-07-28 also checked the deployed application in
Chrome at desktop, tablet portrait, tablet landscape, short DevTools, and mobile
viewports. Product and order APIs loaded without console errors; the cart,
quantity, and discount calculations were exercised without creating another
Stripe order.

## Key trade-offs

- A shared passcode is appropriate for the short-lived internal booth workflow,
  but it is not user-level authentication.
- CNY is a catalog-based reference total, not a live foreign-exchange quote.
- Stripe receives one aggregate USD line item for the order. Full product
  detail remains in this application's database and invoice.
- Browser storage protects the active draft on one device; it does not sync
  drafts between devices.
- PostgreSQL is used instead of browser-only persistence so order history and
  payment state survive server restarts.

## What I would improve with more time

- Add an authenticated catalog upload and validation preview.
- Add automated browser tests for the complete order and webhook flows.
- Add monitoring, structured logs, backups, and deployment health alerts.
- Add an operator-visible webhook delivery history.
- Replace invoice placeholder details with approved legal company information.
- Add a controlled offline queue for order creation after reconnection.

## AI workflow notes

### Tools used

- **OpenAI Codex** was used as a coding, requirements-review, and debugging
  assistant.
- **Chrome DevTools MCP server** was used to inspect the running application in
  a real Chrome browser, test responsive viewport sizes, measure DOM layout and
  scroll behavior, capture screenshots, and check browser console logs.

### Example prompts

1. "Read the supplied project files and audit every requirement and constraint."
2. "Keep the checkout in the viewport, make the navigation sticky, and limit
   scrolling to the correct responsive region."
3. "Inspect the responsive design with Chrome DevTools at tablet portrait and
   landscape sizes, then verify that the checkout button remains visible and
   the catalog can be reached by scrolling."

### How the generated code was verified

Generated changes were not accepted on description alone. I:

- checked each change against the supplied assignment and production brief;
- reviewed the resulting source code and Git diff;
- ran the API unit tests, TypeScript builds, and frontend linting with
  `npm run verify`;
- used the Chrome DevTools MCP server at `768 × 1024`, `820 × 768`, and
  `1024 × 768` viewport sizes;
- measured the checkout, header, catalog, and scroll-container positions in the
  browser DOM;
- confirmed the sticky navigation remained visible while scrolling;
- confirmed the populated **Create payment link** button stayed inside the
  viewport;
- checked Chrome console output for runtime errors.

Chrome DevTools was used for browser inspection and responsive measurements,
not as a substitute for the automated test suite. Pricing and payment behavior
remain server-authoritative.

## Scope boundaries

As required, this project does not include inventory tracking, multi-user
roles, a refunds UI, or analytics. Refunds remain a Stripe Dashboard task.

## Submission deployment checklist

- Provision PostgreSQL and run `npm run db:migrate`.
- Configure all environment variables through hosting secrets.
- Set the exact deployed origin in `CORS_ORIGIN`.
- Set `NODE_ENV=production`.
- Keep `APP_MODE=test`; the API rejects every other mode.
- Configure the deployed Stripe test webhook URL.
- Validate enabled payment methods end to end.
- Test on the booth tablet over a phone hotspot.
- Complete a Stripe test-card payment and confirm the paid status.

## Required screen recording

The assignment requires a separate recording of up to five minutes. Attach its
shareable link with the submission message rather than committing a large video
file or a temporary private URL to this repository. The recording should show:

1. unlocking the deployed application;
2. adding three items, including a blonde item;
3. an expo or at-least-10 kg volume discount and non-stacking behavior;
4. creating the test Payment Link and QR code;
5. paying with a Stripe test card; and
6. the order changing to **Paid** through the webhook or **Check status**.

## Vercel + Railway deployment

Keep this as one Git repository, but deploy it as two services:

- Vercel project root: `apps/web`
- Railway API service root: `/apps/api`
- Railway PostgreSQL service: in the same Railway project as the API

The API's `railway.json` builds the server, runs the database migration as a
pre-deploy command, starts the compiled application, and checks `/health`.
The web app's `vercel.json` keeps Vite SPA routes on `index.html`.

### Railway API

1. Create an empty Railway project.
2. Add PostgreSQL from **New → Database → PostgreSQL**.
3. Add a service from this GitHub repository.
4. Set its root directory to `/apps/api`.
5. If Railway does not find the config automatically, set the config file path
   to `/apps/api/railway.json`.
6. Add these service variables:

   ```text
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   STRIPE_SECRET_KEY=<actual sk_test_ or restricted rk_test_ key>
   PASSCODE=<strong booth passcode>
   APP_MODE=test
   NODE_ENV=production
   CORS_ORIGIN=https://temporary.invalid
   ```

   Use the temporary locked-down CORS origin only for the first API deployment.
   Replace it with the Vercel production URL in the web deployment step. Do not
   set `PORT`; Railway injects it.

7. Generate a public Railway domain and confirm:

   ```text
   https://<railway-domain>/health
   ```

### Vercel web

1. Import the same GitHub repository as a Vercel project.
2. Set **Root Directory** to `apps/web`.
3. Keep the detected Vite build settings:

   ```text
   Build command: npm run build
   Output directory: dist
   ```

4. Add this production build-time variable:

   ```text
   VITE_API_URL=https://<railway-api-domain>
   ```

5. Deploy, copy the final Vercel production URL, set that exact URL as the
   Railway API's `CORS_ORIGIN`, and redeploy the API.

### Deployed test-mode Stripe webhook

In Stripe Workbench, register:

```text
https://<railway-api-domain>/api/webhooks/stripe
```

Subscribe to:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
```

Copy that endpoint's `whsec_...` signing secret into the Railway API variable
`STRIPE_WEBHOOK_SECRET`, then redeploy the API. Test the complete flow in Stripe
test mode with a Stripe test card such as `4242 4242 4242 4242`.

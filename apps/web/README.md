# Web application

React and Vite interface for the TRUNOV HAIR expo order desk.

For complete setup, pricing decisions, Stripe instructions, and the production
checklist, see the [repository README](../../README.md).

## Commands

Run from this directory:

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Or run the build and lint commands from the repository root:

```bash
npm run web:lint
npm run web:build
```

The API must be running before starting the development server so authentication,
catalog, pricing, and order requests can complete.

## Configuration

The web app reads:

```text
VITE_API_URL=http://localhost:3001
```

Vite loads this from `apps/web/.env` during local development. On a hosting
platform, configure it as a build-time environment variable.

The shared passcode is sent to the API as the `x-passcode` header. The actual
passcode remains server-side and must not be placed in a `VITE_` variable.

## Feature organization

```text
src/
|-- api/          Typed API calls
|-- app/          Application composition and responsive styles
|-- config/       Environment access
|-- features/
|   |-- auth/     Passcode gate
|   |-- catalog/  Search, filters, and product cards
|   |-- order/    Draft, pricing preview, and checkout
|   |-- orders/   History, status refresh, and CSV export
|   `-- payment/  QR dialog and printable invoice
|-- lib/          HTTP client
|-- types/        Shared commerce types
`-- utils/        Formatting helpers
```

Feature components are composed in `src/app/app.tsx`. Shared network contracts
live in `src/types/commerce.ts`.

## Client behavior

- The active order draft is persisted in `localStorage`.
- The passcode is held in `sessionStorage`.
- Pricing previews are debounced and requested from the API.
- Network status is visible; payment actions are disabled while offline.
- A synchronous in-flight guard prevents repeated checkout submissions.
- Failed Payment Link creation can be retried against the already-saved order.
- Payment status can be refreshed from the QR dialog or Orders screen.
- Paid orders expose a **Print / Save PDF** action in the order history.
- CSV downloads are requested from the API.
- Printing the payment dialog renders the dedicated A4 invoice.

## Responsive layout

At widths above 820 px, the workspace stays within the viewport. The checkout
remains visible and the product grid is the primary scroll region, with its
scrollbar hidden.

At widths of 820 px or below, checkout and catalog stack vertically inside one
page-level scroll region. Navigation stays sticky, and the search field does
not autofocus because doing so would jump past the checkout on initial load.

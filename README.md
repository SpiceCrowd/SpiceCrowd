This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Workspace Commands

From workspace root (`spicecrowd/`) you can now run:

```bash
npm run dev
```

This forwards to `spicecrowd-web` dev server.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
A Next.js storefront.

## Dev placeholder APIs and milestones

I added placeholder API routes and UI stubs for the full e-commerce milestone plan so you can iterate without external services.

Quick endpoints:

- `POST /api/orders` — create a dummy order (returns `orderId`).
- `GET  /api/orders` — list dummy orders.
- `POST /api/payments` — returns a dummy client token for payments.
- `POST /api/payments/webhook` — payment webhook placeholder.
- `POST /api/auth` — login/register placeholder returning a test token.
- `GET/POST /api/admin/products` — admin product placeholder (uses local product lib).
- `POST /api/coupons` — coupon validation mock (`SPICE10`, `FIRST20`).
- `GET /api/search?q=term` — basic product search using product lib.
- `POST /api/reviews` — review submission placeholder.
- `GET/POST /api/wishlist` — wishlist placeholder.

Environment variables are in `.env.example`. These are placeholders; real provider keys should be added to your environment or CI secrets when integrating real services.

Validation steps (examples):

1. Start dev server:

```powershell
npm run dev
```

2. Create a dummy order:

```powershell
curl -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d '{"items":[{"slug":"kolli-hills-turmeric","quantity":1}],"total":100}'
```

3. Create a payment token:

```powershell
curl -X POST http://localhost:3000/api/payments -H "Content-Type: application/json" -d '{"amount":100}'
```

4. Validate coupon:

```powershell
curl -X POST http://localhost:3000/api/coupons -H "Content-Type: application/json" -d '{"code":"SPICE10"}'
```

These endpoints are mock implementations to speed development and testing.

Email provider (Milestone)

- To enable real outbound email via SendGrid set `SENDGRID_API_KEY` and optional `FROM_EMAIL` in your environment. The app will use SendGrid; otherwise it falls back to logging to `data/email-log.json`.

Database & Prisma (local dev)

- A local SQLite DB is configured for quick testing. Recommended local setup and seed:

```bash
cd spicecrowd-web
npm install
npx prisma generate
# Push the schema to dev SQLite (fast, no migrations required for early dev)
npx prisma db push
# Or run a migration (if you prefer):
# npx prisma migrate dev --name init
# Seed initial products and data
npm run prisma:seed
# Start the dev server
npm run dev
```

If PowerShell reports that scripts are disabled, either run the commands from Command Prompt (`cmd`) or enable script execution for the current user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

For production, set `DATABASE_URL` to a PostgreSQL connection string and change the Prisma `provider` to `postgresql` in `prisma/schema.prisma` before running migrations on the production database.


## Admin usage

1. Open the admin products UI at `/admin/products` while running the dev server.
2. Create, edit or delete products — changes are persisted in `data/products.json` for local development.

API admin endpoints:

- `GET /api/admin/products` — list products (seeds from `src/lib/products.ts` on first run)
- `POST /api/admin/products` — create or update product (JSON body: `title`, `slug`, `price`, `description`)
- `PUT /api/admin/products` — update product (JSON body must contain `slug`)
- `DELETE /api/admin/products?slug=...` — delete product by slug

Shipping, tax & email (milestone 5)

- `POST /api/shipping` — compute shipping cost (body: `pincode`, optional `items`) — mock rule: pincodes starting with `6` => ₹50, otherwise ₹99.
- Orders now accept `coupon` and `address.gstin` and compute discount, shipping and tax during creation. Orders are persisted to `data/orders.json`.
- `POST /api/email/send` — placeholder to log outbound emails to `data/email-log.json`.

Milestone 5 readiness files:

- Production checklist: `docs/PRODUCTION_CHECKLIST.md`
- Local smoke checks: `npm run smoke:local`
- Environment preflight: `npm run preflight:env`
- Local env file preflight: `npm run preflight:local-env`
- Dev readiness (preflight + smoke): `npm run dev:ready`
- Full release checks: `npm run release:check`

Local secure env setup:

1. Copy `.env.local.example` to `.env.local`.
2. Fill all required keys for your local setup.
3. Run `npm run preflight:env` to verify keys are available in your environment.
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

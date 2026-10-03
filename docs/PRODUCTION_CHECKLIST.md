# Production Checklist

## 1. Core Environment

Set these environment variables in production:

- DATABASE_URL
- JWT_SECRET
- ADMIN_EMAIL
- ADMIN_PASSWORD
- NEXT_PUBLIC_SITE_URL (`https://www.spicecrowd.shop`)
- NEXT_PUBLIC_MAP_URL

## 2. Payments

Live checkout is intentionally disabled in production. The current payment endpoint is a local demo flow, not a real payment integration. Do not enable real sales until a payment provider is integrated with server-side amount verification, signed webhook verification, and idempotent payment/order handling.

## 3. Email

Set email provider key:

- EMAIL_PROVIDER_API_KEY

## 4. Security

- Use a strong, unique JWT secret.
- Do not use development secrets in production.
- Restrict admin tokens to trusted users only.

## 5. Database

- This repository currently uses SQLite and file-backed JSON storage for development and preview.
- Before accepting real orders, migrate the Prisma datasource and order/inventory storage to a persistent production database.
- Configure the production `DATABASE_URL` and run Prisma migrations during deployment.
- Verify seed strategy before first release.

## 6. Render Production Hosting

- The current Render Free service is a preview only. It can sleep when idle and its SQLite/file storage is temporary.
- The canonical domain is `www.spicecrowd.shop`; DNS currently points the apex and `www` host to Render.
- Move to a plan and database/storage configuration with persistent data before production use.

## 7. Build and Smoke Validation

Run:

- npm run lint
- npm run build
- npm run test
- npm run preflight:env
- npm run smoke:local

Consolidated command:

- npm run release:check

## 8. Admin Mutation Safety Checks

- Confirm admin endpoints return 403 without valid admin token.
- Confirm invalid payloads return 400 with validation message.
- Confirm valid payloads mutate data correctly.

## 9. Release Readiness

- Keep production checkout disabled until a real payment provider and persistent database are configured and verified.
- Test payment success, failure, retry, webhook idempotency, stock reservation, and order ownership in a sandbox/staging environment only.
- Confirm auth login/register/account route behavior.
- Confirm footer and support links resolve correctly.

## 10. Workspace Root Commands

From workspace root (`spicecrowd/`) you can run:

- npm run dev
- npm run lint
- npm run release:check

## Render Preview Deployment

- Connect this GitHub repository in Render and create the service from `render.yaml`.
- The Blueprint creates a free preview service and prompts for `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- The free service uses temporary SQLite storage. Data can be lost on sleep, restart, or deploy; do not use it for real customer accounts or orders.
- Production POST requests to payment and order creation return `503` until a real gateway is implemented.
- Configure persistent production storage and real payment verification before enabling checkout.
- `spicecrowd.shop` and `www.spicecrowd.shop` are attached as custom domains. Preserve email DNS records and nameservers when changing website records.

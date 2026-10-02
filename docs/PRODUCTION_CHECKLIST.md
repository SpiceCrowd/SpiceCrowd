# Production Checklist

## 1. Core Environment

Set these environment variables in production:

- DATABASE_URL
- JWT_SECRET
- ADMIN_EMAIL
- ADMIN_PASSWORD
- NEXT_PUBLIC_SITE_URL (`https://www.spicecrowd.in`)
- NEXT_PUBLIC_MAP_URL

## 2. Payments

Set payment keys:

- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET

## 3. Email

Set email provider key:

- EMAIL_PROVIDER_API_KEY

## 4. Security

- Use a strong, unique JWT secret.
- Do not use development secrets in production.
- Restrict admin tokens to trusted users only.

## 5. Database

- This repository currently uses SQLite and file-backed JSON storage for development.
- Before accepting real orders, confirm Hostinger provides persistent storage for the configured database path, or migrate the Prisma datasource and migrations to a managed production database.
- Configure `DATABASE_URL` in Hostinger and run Prisma migrations during deployment.
- Verify seed strategy before first release.

## 6. Hostinger Node.js Web App

- Import `SpiceCrowd/SpiceCrowd` from the `main` branch; the Next.js app is at the repository root.
- Use Node.js 22 or newer supported by the hosting platform.
- Build command: `npm run build`.
- Start command: `npm run start`.
- Attach `www.spicecrowd.in` after deployment and use the DNS records Hostinger provides.

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

- Confirm checkout success flow and stock-block flow.
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
- Configure a persistent production database and update the Prisma provider/schema before accepting real transactions.
- Add `www.spicecrowd.in` as a custom domain in the Render service after the first successful deploy, then use the DNS values Render displays. Keep existing mail records and nameservers unchanged.

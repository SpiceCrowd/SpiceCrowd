# Production Checklist

## 1. Core Environment

Set these environment variables in production:

- DATABASE_URL
- JWT_SECRET
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

- Run Prisma generate.
- Run migrations on production database.
- Verify seed strategy before first release.

## 6. Build and Smoke Validation

Run:

- npm run lint
- npm run build
- npm run test
- npm run preflight:env
- npm run smoke:local

Consolidated command:

- npm run release:check

## 7. Admin Mutation Safety Checks

- Confirm admin endpoints return 403 without valid admin token.
- Confirm invalid payloads return 400 with validation message.
- Confirm valid payloads mutate data correctly.

## 8. Release Readiness

- Confirm checkout success flow and stock-block flow.
- Confirm auth login/register/account route behavior.
- Confirm footer and support links resolve correctly.

## 9. Workspace Root Commands

From workspace root (`spicecrowd/`) you can run:

- npm run dev
- npm run lint
- npm run release:check

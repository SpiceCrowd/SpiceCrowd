# SpiceCrowd Web Milestones

## Milestone 1: Shared App Stability
Status: In progress

Scope:
- Fix shared storage helpers used by API routes and local JSON persistence.
- Stabilize auth, cart, and wishlist client providers.
- Fix search client typing and initialization issues.
- Remove broken duplicated API handler code.

Built in this milestone:
- Cleaned `src/app/api/admin/products/route.ts` after duplicated code was introduced.
- Started core cleanup for storage and shared client state.

Exit criteria:
- Touched foundation files pass focused lint checks.
- Shared helpers no longer violate React hook rules.
- Client state initializes without effect-driven state hydration warnings.

## Milestone 2: Catalog And Discovery
Status: Planned

Scope:
- Product listing and product detail typing cleanup.
- Search, filter, and browse flow hardening.
- Image and navigation lint cleanup in catalog components.

## Milestone 3: Cart, Checkout, And Orders
Status: Completed

Scope:
- Cart interactions, checkout form, order creation, and confirmation flow.
- Shipping, tax, coupon, and invoice path validation.

Built in this milestone:
- Added stronger checkout blocking UX for stock mismatches and empty-cart states.
- Added universal `Back to cart` action for every blocking checkout condition.
- Disabled payment action until checkout blockers are resolved.
- Improved stock mismatch detection by normalizing missing stock values to `0`.
- Verified checkout behavior paths for empty cart and stock mismatch scenarios.

Exit criteria:
- Checkout shows clear blocking message for empty cart and stock mismatch.
- `Back to cart` appears in blocking states.
- Payment button is disabled while blockers exist.
- Checkout page changes pass lint checks.

## Milestone 4: Admin Operations
Status: Completed

Scope:
- Admin products, inventory, batches, purchases, and supplier flows.
- Safer mutations and data validation across admin APIs.

Progress update (batch 1 complete):
- Hardened `src/app/api/admin/products/route.ts` with stricter input parsing, duplicate slug prevention, safer updates, and 404 checks on delete/update paths.
- Hardened `src/app/api/admin/inventory/purchases/route.ts` with admin authorization and strict items payload validation.
- Hardened `src/app/api/admin/inventory/suppliers/route.ts` with admin authorization and mandatory supplier name validation.
- Hardened `src/app/api/admin/inventory/batches/adjust/route.ts` with admin authorization and strict id/delta validation.

Progress update (batch 2 complete):
- Hardened `src/app/api/admin/products/upload/route.ts` with admin authorization, slug sanitization, MIME whitelist, and upload size limits.
- Hardened `src/app/api/admin/inventory/batches/route.ts` with admin authorization and strict validation for create/update payloads.
- Hardened `src/app/api/admin/inventory/alerts/route.ts` with admin authorization for mutation and safe threshold clamping.

Remaining for completion:
- Run focused mutation-path verification for admin dashboard flows.

## Milestone 5: Integrations And Production Readiness
Status: Completed

Scope:
- Payments, email, analytics, auth hardening, and environment setup.
- Build, lint, tests, and deployment readiness.

Immediate kickoff tasks:
- Standardize local dev start command and fix root-level `npm run dev` failure path.
- Add a production environment checklist (`DATABASE_URL`, `JWT_SECRET`, payment keys, email provider keys).
- Add focused smoke checks for auth, checkout, and admin mutations before deploy.

Progress update (kickoff complete):
- Added root workspace script forwarding via `spicecrowd/package.json` so `npm run dev` and `npm run lint` work from workspace root.
- Added production checklist at `docs/PRODUCTION_CHECKLIST.md`.
- Added non-interactive local smoke script at `scripts/smoke-local.ps1` and package command `npm run smoke:local`.
- Verified smoke checks pass locally, including admin guard checks.

Completion update:
- Added auth session-expiry hardening in `src/components/auth/AuthProvider.tsx`.
- Added environment preflight script `scripts/preflight-env.mjs` and command `npm run preflight:env`.
- Added consolidated release command `npm run release:check` and root forwarding scripts.
- Verified local smoke checks pass and preflight correctly fails when required deployment secrets are missing.
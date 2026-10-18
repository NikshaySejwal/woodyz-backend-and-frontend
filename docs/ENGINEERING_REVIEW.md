# WOODYZ Engineering Review

## Executive Summary

The repository has a coherent Next.js + Spring Boot layered structure and a useful SEO foundation. Earlier critical findings around public order access, client-trusted totals, checkout bypass, and predictable seeded credentials have been addressed in the current working tree. WOODYZ is still not production-ready: webhook events do not drive payment reconciliation or fulfillment, inventory is not enforced, JWT remains in localStorage, abuse controls are incomplete, database migrations are unmanaged, and production deployment is not wired.

## Verified Complete or Present

- Shared SEO component with canonical, robots, Open Graph, and Twitter metadata.
- Home and product JSON-LD.
- XML sitemap, HTML sitemap, robots route, and llms route.
- BCrypt password encoding.
- Admin route rules for product writes and analytics.
- JWT filter and stateless session configuration.
- Docker Compose, frontend/backend Dockerfiles, and load-test script.
- Cookie-consent UI with persisted choice.
- Frontend and backend build/test commands are available; previous verification recorded a successful frontend build and backend Maven test run with explicit Java/Maven environment.

## Critical Findings

### 1. Public order API

- Severity: CRITICAL
- Files: `backend/src/main/java/com/example/woodyzbackend/config/SecurityConfig.java`, `backend/src/main/java/com/example/woodyzbackend/controller/OrderController.java`
- Status: FIXED in the current working tree.
- Problem: the previous configuration exposed `/api/orders/**` through `permitAll`.
- Impact: unauthorized order disclosure, tampering, and fraudulent order creation.
- Fix applied: order requests require authentication, customer lookups are scoped to the authenticated user, and order creation derives user/email/status from the authenticated principal.

### 2. Client-controlled order and payment amounts

- Severity: CRITICAL
- Files: `PaymentController.java`, `OrderController.java`, `Order.java`, `pages/checkout.js`
- Status: FIXED for the current checkout flow.
- Problem: the previous flow trusted client-supplied amount, total, status, user ID, and email.
- Impact: price manipulation and false paid orders.
- Fix applied: checkout submits product IDs and quantities, totals are recalculated from the product repository, Stripe payment status and amount are verified before persistence, and retries use Stripe request idempotency plus unique same-customer order lookup. A signed webhook receiver deduplicates/stores events but does not reconcile payments or drive fulfillment.

### 3. Payment bypass in checkout UI

- Severity: CRITICAL
- File: `woodyz-frontend/pages/checkout.js`
- Status: FIXED.
- Problem: the previous checkout exposed “Bypass Payment (Test)”.
- Impact: production users can create paid orders without payment.
- Fix applied: the bypass was removed.

### 4. Seeded admin credentials

- Severity: CRITICAL
- File: `backend/src/main/java/com/example/woodyzbackend/config/DataInitializer.java`
- Status: FIXED in the current working tree.
- Problem: the previous initializer created `admin` with `admin123`.
- Impact: predictable privileged account.
- Fix applied: predictable admin creation was removed. A secure first-run admin provisioning process is still required before production launch.

### 5. Secret and database fallbacks

- Severity: HIGH
- Files: `backend/src/main/resources/application.properties`, `docker-compose.yml`
- Status: PARTIALLY FIXED.
- Problem: the previous configuration used committed secret fallbacks and a plaintext Compose database password.
- Fix applied: JWT, Stripe, SendGrid, and Compose database credentials are now required from environment variables. Rotate any previously exposed credentials and use a secret manager in production.

### 6. Browser token storage

- Severity: HIGH
- Files: `AuthContext.js`, `lib/api.js`
- Problem: JWT is stored in localStorage.
- Impact: XSS can read the bearer token.
- Fix: prefer secure, HttpOnly, SameSite cookies with an appropriate CSRF strategy, or document and harden the bearer-token model.

## High-Priority Gaps

- Order creation is idempotent for repeated same-customer submissions using an existing PaymentIntent, with database uniqueness as the concurrency guard. PaymentIntent creation also uses authenticated-user-scoped request idempotency keys forwarded to Stripe. A signed webhook receiver persists event IDs once for audit/replay deduplication; it does not reconcile or fulfill orders.
- No OrderItem/inventory/stock enforcement or server-side shipping/tax calculation.
- No rate limiting, password reset, email verification, or password-strength policy visible.
- Limited backend coverage: thirteen unit tests cover server-derived order pricing/identity, payment rejection, duplicate retry handling, request idempotency key handling, Stripe webhook signatures, and event deduplication. Auth, webhook endpoint integration, inventory, validation, and database concurrency cases remain untested.
- Docker backend build skips tests; CI runs Maven `verify` before image publishing, but does not deploy images.
- CORS is configurable through `FRONTEND_ORIGIN` (default `http://localhost:3000`); production must set the exact storefront origin.
- GitHub Actions now runs backend Maven verification and publishes backend/frontend images with commit-SHA tags as well as `latest`. The pipeline does not deploy them.
- CSP is now configured in `next.config.mjs`; verify it against all production scripts and third-party assets.
- Legal pages contain placeholders requiring business/legal review.
- Analytics consent exists, but no optional analytics provider is wired through it.
- Accessibility review is incomplete; icon-only controls need accessible names and automated testing.

## SEO Review

Present: shared metadata, product/home JSON-LD, sitemap, robots, HTML sitemap, and llms route.

Incomplete: product/category SEO fields are absent; there is no Category entity; some pages use standalone Head blocks; runtime rendering and canonical/sitemap output still require verification; query/filter duplication handling requires review.

## Missing Tests

- Auth success/failure and role authorization.
- Order ownership and admin order access.
- Webhook endpoint authorization/response integration, PaymentIntent amount validation, and database uniqueness under concurrent submissions.
- Product CRUD authorization and validation.
- Review/support abuse and validation.
- SEO route output, 404 status, sitemap, robots, and metadata.
- Mobile/accessibility checks.

## Recommended Fix Order

1. Design webhook-driven payment reconciliation and fulfillment together with inventory reservation; the current webhook stores receipts only.
2. Replace localStorage JWT storage with an HttpOnly cookie and CSRF strategy; add rate limiting and account recovery/verification controls.
3. Expand backend integration/security tests and validate uniqueness constraints against production data before migration.
4. Configure the production Stripe webhook endpoint and secret, then verify delivery against the deployed HTTPS API.
5. Wire published image tags into deployment, add reviewed database migrations, and establish production backup/rollback procedures.
6. Complete legal, consent/analytics, accessibility, SEO runtime, and performance audits.

## Files Modified

Source files modified in this remediation pass:

- `backend/src/main/java/com/example/woodyzbackend/config/SecurityConfig.java`
- `backend/src/main/java/com/example/woodyzbackend/controller/OrderController.java`
- `backend/src/main/java/com/example/woodyzbackend/controller/PaymentController.java`
- `backend/src/main/java/com/example/woodyzbackend/service/OrderService.java`
- `backend/src/main/java/com/example/woodyzbackend/service/StripeService.java`
- `backend/src/main/java/com/example/woodyzbackend/service/StripeWebhookService.java`
- `backend/src/main/java/com/example/woodyzbackend/entity/StripeWebhookEvent.java`
- `backend/src/main/java/com/example/woodyzbackend/repository/StripeWebhookEventRepository.java`
- `backend/src/main/java/com/example/woodyzbackend/repository/OrderRepository.java`
- `backend/src/test/java/com/example/woodyzbackend/controller/PaymentControllerTest.java`
- `backend/src/test/java/com/example/woodyzbackend/service/StripeServiceTest.java`
- `backend/src/test/java/com/example/woodyzbackend/service/StripeWebhookServiceTest.java`
- `backend/src/test/java/com/example/woodyzbackend/service/OrderServiceTest.java`
- `backend/test_suite.py`
- `load-tests/run_qa_tests.js`
- `woodyz-frontend/run_qa_tests.js`
- `woodyz-frontend/pages/checkout.js`
- `docker-compose.yml`
- `backend/src/main/java/com/example/woodyzbackend/entity/Order.java`
- `backend/src/main/java/com/example/woodyzbackend/dto/CheckoutItemRequest.java`
- `backend/src/main/java/com/example/woodyzbackend/config/DataInitializer.java`
- `backend/src/main/resources/application.properties`
- `backend/src/main/java/com/example/woodyzbackend/WoodyzBackendApplication.java`
- `docker-compose.yml`
- `woodyz-frontend/pages/checkout.js`
- `woodyz-frontend/components/CheckoutForm.js`
- `woodyz-frontend/next.config.mjs`

Documentation files:

- `docs/CODEBASE_MAP.md`
- `docs/FILE_DEPENDENCY_MAP.md`
- `docs/ENGINEERING_REVIEW.md`
- `docs/RUNTIME_QA_REPORT.md`
- `deployment/build.md`
- `deployment/deployment.md`
- `deployment/environments.md`
- `deployment/release-checklist.md`
- `deployment/rollback.md`

## Verification Status

- Frontend `npm run build`: passed after remediation.
- Backend `mvn -B -f backend/pom.xml verify`: passed with 13 tests, 0 failures, on 2026-10-19.
- Frontend `npm run build`: passed on 2026-10-19; Next.js warned about multiple lockfiles and stale Browserslist data.
- Python and JavaScript QA client syntax checks passed; `git diff --check` passed.
- Live Stripe delivery, webhook endpoint integration, Docker image builds, production CORS, and deployment remain unverified.

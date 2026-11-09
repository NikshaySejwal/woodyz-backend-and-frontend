# WOODYZ Engineering Review

## Executive Summary

The repository has a coherent Next.js + Spring Boot layered structure and a useful SEO foundation. WOODYZ has two connected but visually distinct experiences: WOODYZ Toys is the B2C storefront, while WOODYZ Manufacturing is the B2B fabrication and bulk-production experience. The manufacturing quote vertical slice is implemented in the current working tree. Earlier critical findings around public order access, client-trusted totals, checkout bypass, and predictable seeded credentials have been addressed in the current working tree. WOODYZ is still not production-ready: webhook events do not drive payment reconciliation or fulfillment, inventory is not enforced, JWT remains in localStorage, abuse controls are incomplete, database migrations are unmanaged, Spring Boot 2.7.18 is outside open-source support, and production deployment is not wired.

## Verified Complete or Present

- Shared SEO component with canonical, robots, Open Graph, and Twitter metadata.
- Home and product JSON-LD.
- XML sitemap, HTML sitemap, robots route, and llms route.
- BCrypt password encoding.
- Admin route rules for product writes and analytics.
- JWT filter and stateless session configuration.
- Docker Compose, frontend/backend Dockerfiles, and load-test script.
- Docker Compose waits for PostgreSQL and Redis health checks before backend startup and binds PostgreSQL, Redis, frontend, and API host ports to loopback. Backend and frontend container health checks are not configured. A self-managed Compose host would still need firewall/reverse-proxy setup; Railway is the recommended managed-ingress option but has not been configured.
- Hibernate SQL statement logging now defaults to off via `SPRING_JPA_SHOW_SQL=false`; it can be enabled explicitly for local diagnosis.
- Demo product and fake-order seeding now requires `APP_SEED_DEMO_DATA=true`; Compose defaults this off to protect an empty production database. Existing admin bootstrap is wired through optional `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_EMAIL` variables.
- Backend verification now includes a regression test proving demo seed repositories are untouched when seeding is disabled; Maven `verify` passes with 26 tests and the latest backend image was rebuilt locally.
- The write-capable `backend/test_suite.py` now refuses remote targets unless `WOODYZ_ALLOW_REMOTE_MUTATIONS=1`; live PaymentIntent completion additionally requires `WOODYZ_ALLOW_LIVE_PAYMENT=1`. Remote target and payment guards have focused Python unit coverage, which CI runs before publishing images.
- Cookie-consent UI with persisted choice.
- Separate Manufacturing experience at `/manufacturing` and admin quote inbox at `/admin/manufacturing-quotes`.
- Public `POST /api/manufacturing/quotes` validates and persists quote requests; server controls `NEW` and `createdAt`, and public response includes only `id`, `status`, and `createdAt`.
- `GET /api/manufacturing/quotes/admin` requires existing `ROLE_ADMIN` and returns at most the 50 newest submissions.
- GitHub Actions requires HTTPS `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL` values and passes them into the frontend image build; a supplied Stripe publishable key must be live (`pk_live_`), but it is optional while checkout is disabled. The generated CSP allows the configured API origin.
- Frontend Docker build uses `npm ci` and copies only application paths rather than all of the checkout, preventing host `node_modules`, `.next`, and Git metadata from entering the image.
- Frontend Next.js was upgraded to 16.4.2 and compatible transitive dependencies were refreshed after an npm audit found a critical advisory in the old Next.js 16.2.4 pin. Refreshed audits on 2026-10-22 report zero production dependency vulnerabilities and seven development-tool advisories (2 moderate, 5 high) in the Tailwind CSS 3 dependency chain; the complete npm fix requires a breaking Tailwind CSS 4 migration.
- GitHub Actions installs Python 3.12 and runs the manual-QA safety tests, then installs frontend dependencies with Node 20 and runs `npm run test:manufacturing-quote` after backend Maven verification and before publishing images.
- Backend tests (26), Python QA safety tests (3), quote validation tests (5), webpack production build, both Docker image builds, and `git diff --check` passed by 2026-10-22. The temporary local image tags used validation values and were not pushed or deployed. The default Turbopack build had an internal child-process failure in a prior run; webpack is the verified path.
- A fresh `npm run build` on 2026-10-22 reproduced the Turbopack child-process panic in this Windows environment. The frontend build script now explicitly runs `next build --webpack`; the same production build completed and emitted both Manufacturing routes. This selects the verified builder for local and Docker production builds.
- The frontend package has no lint script or ESLint dependency; Next.js 16 production build performs type checking but does not run lint automatically. Lint is therefore not claimed as a completed release check.
- GitHub Actions now runs `npm audit --omit=dev` after `npm ci` and before quote tests/image publishing. The current production dependency tree passed with zero advisories on 2026-10-22; development-only advisories are still tracked separately.
- Stripe checkout is disabled when its frontend or backend key is absent. The backend returns 503 for PaymentIntent creation without a configured real key and no longer fabricates a client secret; Compose permits the backend key to be omitted. Before enabling live checkout, privately verify that the backend secret and frontend `pk_live_` key belong to the same Stripe account.
- Production Compose now binds frontend/API ports to loopback alongside PostgreSQL/Redis; external access requires the selected platform's ingress. Railway is now recommended for managed ingress, but has not been provisioned or tested. `docker compose config --quiet` passed with validation-only environment values on 2026-10-22.
- The frontend Docker image rebuilt successfully as `woodyz-frontend:launch-check` on 2026-10-22 using the updated Webpack build script. Its API/site origins and Stripe key were validation-only values; the image remains local, was not pushed, and must not be deployed.
- The frontend Dockerfile installs, builds, and prunes dev dependencies in one image layer, preventing build-only packages from remaining in earlier runtime image layers. The prune step audited 59 runtime packages with zero reported vulnerabilities; Docker history confirms the combined layer, and the local image returned HTTP 200 for `/manufacturing`. The smoke container was removed; this is not a public-domain or admin-auth integration test.
- Site canonical URLs, Open Graph URLs, product and organization JSON-LD, sitemap, robots, and `llms.txt` now use the normalized `NEXT_PUBLIC_SITE_URL`. A validation-domain Docker image passed HTTP smoke checks for the legal pages, `/ai`, `/sitemap`, `/manufacturing`, `/robots.txt`, `/sitemap.xml`, and `/llms.txt`, including a configured origin with a trailing slash. The user confirmed GoDaddy as registrar and `https://woodyz.in` as canonical site origin. Railway Pro is recommended for ease of operation, but no account, service, DNS, or API hostname has been configured. The current image workflow has no explicit target platform; if a VM provider is chosen later, its processor architecture must be tested before deployment.
- Frontend and backend build/test commands are available; previous verification recorded a successful frontend build and backend Maven test run with explicit Java/Maven environment.
- Fresh revalidation on 2026-10-23: Maven `verify` passed (26 tests), quote form tests passed (5), Python QA safety tests passed (3), and Next.js production build passed with `https://woodyz.in` plus validation-only API/Stripe values. Docker could not be rechecked because this session could not access Docker Desktop; npm production audit could not reach the registry. Both checks had passed on 2026-10-22 and should be repeated when access returns.
- Independent deployment review fact-check: the claim that Compose exposes ports publicly is incorrect for the current file; host mappings use `127.0.0.1`. The claim that production CSP only permits localhost is also incorrect: CI passes `NEXT_PUBLIC_API_URL` at image build, and Next.js derives `connect-src` from that origin. The frontend runtime does not override the compiled browser API URL. Valid remaining gaps are no application/frontend health checks, no Railway service configuration, no PostgreSQL backup/restore evidence, and no external smoke test.

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
- Fix applied: predictable admin creation was removed. A first-run ADMIN can now be created only from explicitly supplied bootstrap environment values; production must configure a unique username and strong secret, then remove the bootstrap password after creation.

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

### 7. Spring Boot support lifecycle

- Severity: HIGH
- File: `backend/pom.xml`
- Status: DECISION REQUIRED.
- Problem: the project pins Spring Boot 2.7.18, which Spring identifies as the end of open-source support for Spring Boot 2.x in November 2023.
- Impact: without a commercial support arrangement, this runtime no longer receives open-source security updates. Spring extended commercial support through the end of 2026.
- Required action: confirm an active commercial support arrangement for launch or schedule and validate a migration to a supported Spring Boot line. [Spring Boot 2.7.18 release note](https://spring.io/blog/2023/11/23/spring-boot-2-7-18-available-now/), [commercial support extension](https://spring.io/blog/2024/09/27/spring-boot-2-7-support-period-extended/).

## High-Priority Gaps

- Order creation is idempotent for repeated same-customer submissions using an existing PaymentIntent, with database uniqueness as the concurrency guard. PaymentIntent creation also uses authenticated-user-scoped request idempotency keys forwarded to Stripe. A signed webhook receiver persists event IDs once for audit/replay deduplication; it does not reconcile or fulfill orders.
- No OrderItem/inventory/stock enforcement or server-side shipping/tax calculation.
- No rate limiting, password reset, email verification, or password-strength policy visible.
- Backend verification now includes 26 passing tests (including quote validation/security and demo-seed protection); production database integration, inventory, payment fulfillment, broad auth, and concurrency coverage remain incomplete.
- Docker backend build skips tests; CI runs Maven `verify` before image publishing, but does not deploy images.
- CORS is configurable through `FRONTEND_ORIGIN` (default `http://localhost:3000`); production must set the exact storefront origin.
- GitHub Actions runs backend Maven verification, Python QA safety tests, and frontend quote validation before publishing backend/frontend images with commit-SHA tags as well as `latest`. The pipeline does not deploy them.
- CSP is now configured in `next.config.mjs`; verify it against all production scripts and third-party assets.
- Legal pages contain placeholders requiring business/legal review.
- Analytics consent exists, but no optional analytics provider is wired through it.
- Accessibility review is incomplete; icon-only controls need accessible names and automated testing.
- Manufacturing quote MVP has no rate limiting/CAPTCHA, duplicate-submission protection, admin pagination/search, status update, or retention policy. It stores personal contact data and project messages; apply abuse controls and define access/retention before broad production promotion.
- The Manufacturing page describes capabilities and product types, but the repository has no verified manufacturing project photography or case studies. The brief calls for visitors to view projects before requesting quotes; use approved real project examples or explicitly launch without that proof. Do not invent client work or reuse toys product imagery as manufacturing evidence.
- `manufacturing_quote_requests` is currently managed by Hibernate `ddl-auto=update`; production PostgreSQL schema creation and rollback have not been rehearsed. This is not a reviewed migration process.
- Railway is the recommended host for low-operations deployment, but account/service setup and the owner-approved spending limit are outstanding. API domain, DNS/TLS, Railway variables, database backups, and public runtime are unconfigured. GitHub Actions publishes images but does not deploy them.

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
- Quote tests cover MockMvc validation/security and a temporary H2 HTTP smoke check. Production PostgreSQL migration, deployed CORS/TLS/proxy behavior, spam controls, and browser-driven accessibility remain unverified.

## Recommended Fix Order

1. Design webhook-driven payment reconciliation and fulfillment together with inventory reservation; the current webhook stores receipts only.
2. Replace localStorage JWT storage with an HttpOnly cookie and CSRF strategy; add rate limiting and account recovery/verification controls.
3. Expand backend integration/security tests and validate uniqueness constraints against production data before migration.
4. Configure the production Stripe webhook endpoint and secret, then verify delivery against the deployed HTTPS API.
5. Provision Railway frontend/backend/PostgreSQL services, configure private database access and persistent uploads if needed, add reviewed database migrations, and establish production backup/rollback procedures. Railway deployment remains unverified.
6. Before enabling quote intake broadly in production, choose abuse throttling and personal-data retention, then rehearse `manufacturing_quote_requests` creation against a production-like PostgreSQL backup. Adopt a reviewed migration process.
7. Complete legal, consent/analytics, accessibility, SEO runtime, and performance audits for both Toys and Manufacturing.

## Files Modified

### Manufacturing Quote MVP in the current working tree

- Backend: `ManufacturingQuoteRequest` entity, create/request and response DTOs, repository, service, controller, and explicit `SecurityConfig` route matchers.
- Backend tests: `ManufacturingQuoteRequestControllerTest` and `ManufacturingQuoteRequestSecurityTest`.
- Frontend: `/manufacturing` public page, `/admin/manufacturing-quotes` admin page, validation helper and tests, Manufacturing-specific layout handling, and admin navigation link.
- No payment, checkout, orders, Stripe, JWT implementation, or existing Toys purchase-flow behavior was changed for this feature.
- No quote file upload or email notification was added.

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

## Product and UX Audit (2026-10-23)

A route-by-route source review covering buttons, core customer/admin journeys, accessibility patterns, SEO metadata, SOLID/code boundaries, backend security, and deployment architecture is recorded in [PRODUCT_AUDIT.md](PRODUCT_AUDIT.md). It confirms the repository builds and focused checks pass, while checkout shipping capture, mock-payment release guards, inert storefront controls, the duplicate support widget, private-route noindex metadata, and live/browser checks remain open. No application source was changed during that audit; screenshot-based visual checks were unavailable.

- Manufacturing quote verification on 2026-10-21: backend Maven test passed with 25 tests; frontend quote validation passed with 5 tests; webpack production build and `git diff --check` passed. Temporary H2 HTTP check verified public receipt-field restriction and anonymous/admin listing access. PostgreSQL production schema rollout and browser QA remain unverified.
- Launch build-path fix on 2026-10-21: frontend CI now rejects missing/non-HTTPS site and API URLs and a non-live Stripe public key; Next.js CSP includes the configured API origin. Webpack build with `https://api.test.woodyz.invalid` passed and the generated route manifest contained that origin. This verifies build-time wiring only; `https://woodyz.in` is now confirmed as the site origin, while the API hostname and GitHub variables remain unknown.

Historical verification before the quote feature (2026-10-19):

- Frontend `npm run build`: passed after remediation.
- Backend `mvn -B -f backend/pom.xml verify`: passed with 13 tests, 0 failures, on 2026-10-19.
- Frontend `npm run build`: passed on 2026-10-19; Next.js warned about multiple lockfiles and stale Browserslist data.
- Python and JavaScript QA client syntax checks passed; `git diff --check` passed.
- Live Stripe delivery, webhook endpoint integration, production CORS, PostgreSQL migration, browser QA, and deployment remain unverified. Local Docker image builds passed on 2026-10-22; images were not pushed or deployed.

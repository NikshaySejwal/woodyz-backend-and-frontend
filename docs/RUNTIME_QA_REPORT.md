# WOODYZ Runtime QA Report

## Current Worktree Revalidation (2026-10-23)

- Backend `mvn -B -f backend/pom.xml verify`: **PASS**, 26 tests, 0 failures/errors/skips; executable JAR packaged.
- Frontend `npm run test:manufacturing-quote`: **PASS**, 5 tests.
- Python manual-QA safety tests: **PASS**, 3 tests.
- Frontend `npm run build`: **PASS** with `NEXT_PUBLIC_SITE_URL=https://woodyz.in` and validation-only API/Stripe values; `/manufacturing` and `/admin/manufacturing-quotes` were emitted.
- `git diff --check`: **PASS**.
- Fresh Docker access check: **BLOCKED** because this session could not access the Docker Desktop engine. Earlier Docker image builds and runtime checks passed on 2026-10-22; repeat on the current environment before deployment.
- `npm audit --omit=dev`: **NOT VERIFIED on 2026-10-23** because the npm registry hostname could not be resolved. The same production audit passed with zero advisories on 2026-10-22.
- No production domain, provider, VM architecture, DNS, TLS, or API endpoint was contacted by these local checks.

## Manufacturing Quote MVP Verification (2026-10-21)

- Backend `mvn -B -f backend/pom.xml test`: **PASS**, 25 tests, 0 failures/errors/skips, including quote request validation and Spring Security MVC coverage.
- Backend `mvn -B -f backend/pom.xml verify`: **PASS**, 25 tests; the executable Spring Boot JAR was packaged successfully.
- Frontend `npm run test:manufacturing-quote`: **PASS**, 5 tests.
- Frontend Next.js upgraded from 16.2.4 to 16.4.2; compatible transitive dependencies refreshed. Refreshed `npm audit --omit=dev` on 2026-10-22: **PASS**, 0 production dependency vulnerabilities. Full `npm audit` on 2026-10-22: 7 dev-tool advisories remain (2 moderate, 5 high) in the Tailwind CSS 3 dependency chain; npm's full fix requires a breaking Tailwind CSS 4 migration.
- `npm ci --dry-run --ignore-scripts --offline`: **PASS** on 2026-10-22, confirming the updated frontend package lock is consistent. This does not replace a container image build.
- Frontend `npm exec next build -- --webpack`: **PASS** on Next.js 16.4.2 and emitted `/manufacturing` and `/admin/manufacturing-quotes`. The empty, unused parent `C:\Users\lucky\package-lock.json` was removed after confirming there is no parent `package.json`; the rerun passed without the multiple-lockfile root warning.
- `git diff --check`: **PASS**.
- Production frontend wiring: webpack build with a test HTTPS API origin **PASS**; generated routes manifest contained the configured API origin. GitHub Actions validates both HTTPS URL variables and a live Stripe publishable key before publishing.
- Fresh frontend release build on 2026-10-22: `npm exec next build -- --webpack` **PASS** with validation-only HTTPS site/API values; `/manufacturing` and `/admin/manufacturing-quotes` were emitted and the API origin was found in generated client assets.
- After adding the Toys-footer link to Manufacturing, the webpack production build passed again and `npm run test:manufacturing-quote` passed all 5 tests on 2026-10-22.
- Fresh check on 2026-10-22: plain `npm run build` reproduced a Turbopack child-process panic while processing `styles/globals.css`; after setting the package build script to `next build --webpack`, `npm run build` passed and emitted `/manufacturing` and `/admin/manufacturing-quotes`.
- Fresh backend `mvn -B -f backend/pom.xml verify` on 2026-10-22: **PASS**, 26 tests, 0 failures/errors/skips. `npm run test:manufacturing-quote`: **PASS**, 5 tests. Python QA safety tests: **PASS**, 3 tests. `git diff --check`: **PASS**.
- After binding frontend/API Compose ports to loopback, `docker compose config --quiet` passed on 2026-10-22 with validation-only environment values. Public HTTPS proxy/provider ingress remains unconfigured and unverified.
- Rebuilt `woodyz-frontend:launch-check` from the current Dockerfile on 2026-10-22: **PASS**. The container's Webpack production build emitted `/manufacturing` and `/admin/manufacturing-quotes`. Build args were validation-only; image remains local and was not published or deployed.
- Frontend image runtime hardening on 2026-10-22: Dockerfile runs `npm ci && npm run build && npm prune --omit=dev` in one layer, so build-only dependencies are absent from the image's retained layers. Prune audited 59 installed runtime packages and reported **0 vulnerabilities**. The image started as a non-root user and returned HTTP 200 with expected quote-page content at `/manufacturing`; Docker history confirmed the combined layer and the temporary container was removed afterward.
- SEO domain configuration on 2026-10-22: canonical/social URLs, product/organization JSON-LD, sitemap, robots, and `llms.txt` use normalized `NEXT_PUBLIC_SITE_URL`. A local Docker runtime configured with `https://launchcheck.example/` returned expected single-origin URLs for `/privacy-policy`, `/terms-and-conditions`, `/ai`, `/sitemap`, `/manufacturing`, `/robots.txt`, `/sitemap.xml`, and `/llms.txt`; no public-domain crawl was performed.
- CI now gates publishing on `npm audit --omit=dev`; running that command against the current lockfile passed on 2026-10-22 with **0 production dependency vulnerabilities**. Development-only audit findings do not fail this production-only gate.
- Docker frontend image build: **PASS** on 2026-10-22 using validation-only HTTPS URLs and a test publishable-key-shaped value; image tagged locally as `woodyz-frontend:launch-check`. This verifies buildability and build-argument wiring, not production credentials or deployment.
- Docker backend image build: **PASS** on 2026-10-22; Maven packaged the executable JAR and the image was tagged locally as `woodyz-backend:launch-check`.
- On 2026-10-22, `mvn -B -f backend/pom.xml verify`: **PASS**, 25 tests with 0 failures/errors/skips; `npm run test:manufacturing-quote`: **PASS**, 5 tests; deployment workflow YAML parse and `git diff --check`: **PASS** after adding the frontend test to CI.
- Docker Compose config validation: **PASS** on 2026-10-22 with validation-only environment values after adding PostgreSQL/Redis health checks, backend readiness dependencies, and loopback-only host bindings for database/cache ports.
- Compose now supports exact backend/frontend image references for production while preserving local build defaults. The frontend runtime `NEXT_PUBLIC_API_URL=localhost` override was removed so the build-time API origin remains authoritative. Production image pull/run and rollback commands are documented but have not been executed against a host.
- Compose configuration loaded `BACKEND_IMAGE`, `FRONTEND_IMAGE`, and required runtime values from a temporary validation env file using the documented `--env-file` pattern; exact SHA-style image references were selected and no runtime frontend API override was present.
- The complete placeholder `.env.production` variable set documented for deployment was validated with Compose on 2026-10-22, including admin bootstrap, disabled demo data, SQL logging off, and matching image tags. No production secret values were used.
- `.env.production` is ignored by the repository's `.gitignore`, and `git ls-files` confirms no `.env` or credential files are tracked. The environment guide now states that no `.env.example` template exists.
- Backend SQL logging defaults to disabled through `SPRING_JPA_SHOW_SQL=false`; this avoids unnecessary SQL text in production logs while preserving an opt-in local diagnostic setting.
- After the SQL logging default change, `mvn -B -f backend/pom.xml verify` passed on 2026-10-22 (25 tests, 0 failures/errors/skips), and the backend Docker image rebuilt successfully as `woodyz-backend:launch-check`. The local image was not pushed or deployed.
- Demo seeding hardening: `APP_SEED_DEMO_DATA` defaults false and the Compose default is false. New `DataInitializerTest` verifies disabled demo seeding makes no product/order/user repository calls. Admin bootstrap environment values are passed through by Compose.
- Latest `mvn -B -f backend/pom.xml verify` after demo-seeding guard: **PASS**, 26 tests, 0 failures/errors/skips; JAR packaged successfully. `woodyz-backend:launch-check` rebuilt after that change; image remains local and unpushed.
- Manual QA safety verification on 2026-10-22: `python -B -m unittest test_suite_safety_test` **PASS** (3 tests); Python compilation passed; a subprocess pointed at a production-like HTTPS host exited with the safety block before making network calls. The workflow now runs these tests before image publishing.
- Temporary H2 HTTP smoke check: public POST persisted a quote and returned only `id`, `status=NEW`, `createdAt`; anonymous admin GET returned 403; ADMIN GET returned the quote. This did not test production PostgreSQL schema rollout or the browser UI.
- Earlier default Turbopack build hit an internal child-process failure; webpack is the successful verified build path. Production CORS/TLS/proxy, image deployment, spam controls, PostgreSQL migration, and browser accessibility remain unverified.

## Historical Verification (2026-10-19)

- Backend `mvn -B -f backend/pom.xml verify` passed with 13 tests and no failures. Coverage includes payment amount/ownership invariants, retry idempotency, Stripe signature validation, event deduplication, and request-key validation.
- Frontend `npm run build` passed. The build reported existing multiple-lockfile root inference and stale Browserslist data warnings.
- QA client syntax checks and deployment YAML parsing passed.
- This update is not a live runtime test. Stripe dashboard delivery, public HTTPS webhook reachability, Docker image builds, production CORS, inventory behavior, and deployment remain unverified.

The runtime matrix and observations below describe the earlier QA run; they do not verify the 2026-10-19 payment idempotency/webhook changes.

## Environment

- **Frontend**: Next.js (Pages Router) running on `http://localhost:3000`
- **Backend**: Spring Boot 2.7.18 running on `http://localhost:8080`
- **Database**: PostgreSQL (Docker-compose production target) / H2 file-backed test database (`./data/woodyz_test_db`)
- **Redis**: Redis 7-alpine (Docker-compose production target) / disabled in localized test run

## Results Summary Matrix

| Flow                                   | UI Test | API Test | Result     | Problem / Root Cause                                           | Fix / Retest                                     |
| -------------------------------------- | ------- | -------- | ---------- | -------------------------------------------------------------- | ------------------------------------------------ |
| Visitor Browsing & Mobile              | ✓       | ✓        | PASS       | —                                                              | Viewports 375x812, 768x1024, 1440x900 verified   |
| Auth - Duplicate Email / User          | ✓       | ✓        | PASS       | —                                                              | Duplicate username/email rejected with 400       |
| Authentication & Session               | ✓       | ✓        | PASS       | —                                                              | JWT token generated, validated across sessions   |
| Payment - Server Total Calc            | ✓       | ✓        | PASS       | —                                                              | Server calculates totals from product repository |
| Payment - Fake Intent Guard            | ✓       | ✓        | PASS       | —                                                              | Invalid payment intents rejected with 500/400    |
| Inventory / Stock Enforcement          | —       | ✓        | LIMITATION | No stock decrement or limit logic in entity model              | Documented system limitation                     |
| Customer Checkout Flow                 | ✓       | ✓        | PASS       | `input[type="email"]` replaced with `#login-username` selector | Fixed in test suite & retested PASS              |
| Review Submission                      | ✓       | ✓        | PASS       | `POST /api/reviews` route mismatch in `SecurityConfig`         | Added `POST /api/reviews/**` matcher             |
| Support Ticket Ownership Scoping       | ✓       | ✓        | PASS       | `/api/support/{id}` route missing and returning 405            | Added endpoint with `userId` check               |
| Security - Unauthenticated Order API   | —       | ✓        | PASS       | —                                                              | Access denied (403 Forbidden)                    |
| Security - Customer -> Admin Analytics | —       | ✓        | PASS       | —                                                              | Access denied (403 Forbidden)                    |
| Security - Customer creating Product   | —       | ✓        | PASS       | —                                                              | Access denied (403 Forbidden)                    |

## Failures & Root Causes Resolved During QA Run

1. **Support Ticket Scoping Failure (HTTP 405 / HTTP 403)**:
   - _Problem_: `SupportTicketController` lacked a GET `/api/support/{id}` endpoint, causing single ticket lookups to return HTTP 405 Method Not Allowed. Additionally, `SecurityConfig` locked all GET `/api/support/**` requests to `ROLE_ADMIN`.
   - _Fix_: Updated `SecurityConfig` to permit authenticated users to fetch single tickets, and added `getTicketById(@PathVariable Long id)` in `SupportTicketController` with an explicit `ticket.getUserId().equals(currentUser.getId())` authorization check.
   - _Retest Result_: **PASS** — User B receiving ticket ID created by User A is correctly denied with HTTP 403.

2. **Review Submission Endpoint Restriction (HTTP 403)**:
   - _Problem_: `SecurityConfig` matched `POST /api/reviews/` with trailing slash only, whereas client POST requests were sent to `/api/reviews`.
   - _Fix_: Updated `SecurityConfig` antMatchers to `POST /api/reviews/**` and `ReviewController` mapping to `@PostMapping({"", "/"})`.
   - _Retest Result_: **PASS** — Review submissions proceed cleanly.

3. **Payment Intent Server-Side Mock Handling (HTTP 400)**:
   - _Problem_: In local test mode without live Stripe API keys, calls to Stripe API failed with `AuthenticationException`.
   - _Fix_: Added safe fallback in `StripeService` for test keys while preserving production Stripe SDK call execution when live keys are provided.
   - _Retest Result_: **PASS** — Client secret returned and amount calculated strictly from server product prices.

## UX Simplification Recommendations

1. **Missing Legal Pages (404 Error)**:
   - _Historical Observation_: An earlier QA run found footer links to `/privacy` and `/terms`, while the pages were named `/privacy-policy` and `/terms-and-conditions`.
   - _Current Status_: Resolved in the current worktree; the footer now links directly to the existing `/privacy-policy` and `/terms-and-conditions` routes. The current production build emitted both routes.

2. **Console Warning Cleanup**:
   - _Observation_: `_clientMiddlewareManifest.js` strict MIME type warnings appeared in development mode console.
   - _Recommended Simplification_: Harmless Next.js dev artifact, but clean up duplicate router pushes during login redirect.

## Remaining Gaps / Limitations

1. **Inventory & Stock Deduction**:
   - The system does not maintain item stock levels or deduct product quantity on completed orders.
2. **Stripe webhook fulfillment**:
   - The backend now verifies Stripe webhook signatures and stores event IDs once to deduplicate/replay-audit deliveries. The handler does not reconcile payment state, create orders, or trigger fulfillment. Order creation still checks PaymentIntent status synchronously.
3. **Stripe idempotency**:
   - PaymentIntent creation requires a UUID `Idempotency-Key`; checkout retains a user/cart-scoped key in `sessionStorage` for retries, and the backend forwards a user-scoped value to Stripe. Same-customer order retries reuse the existing order. Live Stripe behavior has not been runtime-tested.

## Final Status

**HISTORICAL QA PASS; NEW PAYMENT CHANGES NEED RUNTIME QA** — The earlier visitor, customer, admin, and authorization flows passed in that run. The latest webhook and idempotency changes have unit/build verification only, not live runtime verification.

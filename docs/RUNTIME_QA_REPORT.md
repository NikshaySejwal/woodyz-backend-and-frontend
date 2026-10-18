# WOODYZ Runtime QA Report

## Current Update (2026-10-19)

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
   - _Observation_: Footer links lead to `/privacy` and `/terms`, resulting in 404 pages. The existing pages in the repository are named `/privacy-policy` and `/terms-and-conditions`.
   - _Recommended Simplification_: Add Next.js rewrites in `next.config.mjs` or update Footer links to point directly to `/privacy-policy` and `/terms-and-conditions`.

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

# Runtime Validation Report

**Generated:** 2026-11-02T02:05:23+05:30  
**Target:** WOODYZ full-stack application

## Summary

| Step | Status | Exit code | Details |
|---|---|---:|---|
| Startup | PASS | 0 | Docker Compose services running; frontend and product API both returned HTTP 200 |
| Backend tests | PASS | 0 | `mvn -f backend\pom.xml test` — 34 passed |
| Frontend unit tests | PASS | 0 | `npm --prefix woodyz-frontend run test:manufacturing-quote` — 5 passed |
| Frontend build | PASS | 0 | `docker compose build frontend` |
| Mobile + demo/admin browser E2E | PASS | 0 | `npm --prefix woodyz-frontend run test:e2e:demo` — 1 mobile test and 1 multi-customer/admin flow passed |
| Cart/browser E2E | FAIL | 1 | `npm --prefix woodyz-frontend run test:e2e:cart` — 11 passed, 3 failed |

**Overall: FAIL** — the customer demo checkout and admin flows passed, but three cart E2E checks still fail.

## Browser and API findings

| # | Severity | Finding | Evidence |
|---|---|---|---|
| 1 | MEDIUM | Cart item does not reliably survive refresh and navigation. | `cart remains after refresh and navigating away and back` timed out waiting for the added product after navigation; no failed HTTP requests or console errors were recorded. |
| 2 | MEDIUM | Cart state is stale between open tabs. | `a second open tab reflects quantity updates made in the first tab` failed because the first tab did not reflect the update. |
| 3 | LOW | Cart quantity controls do not expose the expected accessible names. | `quantity controls expose meaningful accessible names` timed out waiting for a button named “Decrease quantity”. |

Previously identified checkout profile-ID, legacy support-read, and product-image routing issues were addressed and exercised by the current demo/admin and mobile flows. No new real backend request failures were recorded by the cart suite; its product-API 500 case is an intentionally induced error-path test and passed. The test output did not capture that mocked response body.

## Browser interaction results

- Three disposable customers placed separate local demo orders, using the decorative QR flow once and demo pay-on-delivery twice. Each customer submitted a delivery-related support ticket.
- The admin flow loaded analytics, created/toggled/deleted a temporary coupon, submitted/viewed/deleted a synthetic manufacturing quote, and replied in-app to all four existing tickets.
- The mobile product-layout test passed at 375×812: WOODYZ product image measured 327 px within a 351 px card, positioned 12 px from the viewport edge, with no horizontal page scroll. An accessible LEGO listing measured a 342 px image at 9 px from the edge; Etsy blocked automated inspection.
- The cart suite passed add-one, duplicate-add/merge, plus/minus, item removal, mobile reachability, keyboard operation, induced API-failure handling, unauthenticated-order rejection, invalid payment input rejection, rapid increments, and logout clearing.
- The cart suite failed only on accessible quantity names, cross-tab synchronization, and refresh/navigation persistence.

## E2E test details

Commands and results:

- `npm --prefix woodyz-frontend run test:e2e:demo` — exit code **0**; mobile layout **1/1 passed**, three-customer/admin flow **1/1 passed**.
- `npm --prefix woodyz-frontend run test:e2e:cart` — exit code **1**; **11 passed, 3 failed**.

Failed cart tests:
1. `quantity controls expose meaningful accessible names`
2. `a second open tab reflects quantity updates made in the first tab`
3. `cart remains after refresh and navigating away and back`

The browser evidence files for these failures were saved under the system temporary directory by the E2E harness. No HTTP failures, failed requests, or unexpected console errors were reported for the three failures.

## Database verification

Post-test database counts were verified directly: **2 users, 4 products, 1 order, 0 coupons, 4 support tickets, 0 manufacturing quote requests**. The temporary customer/order/ticket/product/coupon/quote fixtures were cleaned up. Replies to the four original tickets remain saved in-app; no emails were sent.

## Scope and gaps

- Docker, Node.js, Playwright, frontend, backend, and PostgreSQL were available.
- The frontend and product API readiness checks returned HTTP 200.
- Demo payment is enabled only for the local demo profile; it does not charge a payment method or send a confirmation email. Real Stripe payment completion was not tested.
- Coupon creation and lifecycle were tested, but customer coupon redemption is not implemented.
- Product variants, inventory/stock validation, and server-side cart persistence cannot be verified because the application has no variant/inventory model or cart API/table.
- Email delivery, destructive admin actions beyond disposable test fixtures, and independent second-browser-session isolation were not fully tested.

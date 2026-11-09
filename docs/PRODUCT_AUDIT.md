# WOODYZ Product, UX, SEO, Code, and System Audit

**Audit date:** 2026-10-23  
**Repository:** current working tree at `C:\Users\lucky\Desktop\WOODYZ`  
**Audit type:** repository and configuration review with build and test verification. No application source files were changed for this audit.

## Executive summary

The repository has a working Next.js storefront and a layered Spring Boot API. The separate Manufacturing quote flow is implemented with field validation, a restricted public receipt, an ADMIN-only inbox, and focused tests. The current branch passes the checked backend, Python safety, quote-validation, and frontend production-build checks.

**The website is not launch-ready yet.** The highest impact user-facing gap is checkout: shipping fields are displayed but are not collected into application state or sent with the order, so a successful payment does not have a usable shipping destination. The storefront also contains visible controls that do nothing, a fake newsletter confirmation, and a duplicate support widget. Stripe checkout is disabled until valid matching keys are configured.

This was not a visual/browser audit. The available session did not provide a usable browser for screenshots or keyboard/mobile interaction checks. An attempted public scrape of `https://woodyz.in` and `/manufacturing` failed to retrieve page content. Those failures do not establish whether the site is up or down. Live rendering, contrast, Core Web Vitals, indexing, DNS/TLS, and deployed API behavior remain unverified.

## Scope and evidence

Reviewed the Next.js Pages Router routes and shared components, the quote feature, storefront/cart/checkout/account/admin flows, SEO routes and metadata, Spring controllers/services/security/configuration, Compose and existing engineering/deployment notes. Verification run during this audit:

- `mvn -B -f backend\pom.xml verify`: **passed**, 26 tests, no failures or errors.
- `npm run test:manufacturing-quote`: **passed**, 5 tests.
- `python -B -m unittest test_suite_safety_test`: **passed**, 3 tests.
- Frontend `npm run build` with `NEXT_PUBLIC_SITE_URL=https://woodyz.in` and validation-only API/Stripe values: **passed**; generated all 27 listed application routes, including Manufacturing and admin quotes.
- No lint script or ESLint dependency is configured in `woodyz-frontend/package.json`; lint was not run or claimed.
- Existing worktree has unrelated modified and untracked files. This audit did not stage, revert, or clean them.

## Findings by launch impact

### P0 — Checkout does not collect or persist shipping details

**Evidence:** `woodyz-frontend/pages/checkout.js` renders first name, last name, address, city, and ZIP in a standalone form. Those inputs have no values, state, or submission handler. The payment/order requests send only product IDs, quantities, and the PaymentIntent ID. `Order` has a `deliveryAddress` field, but this checkout never supplies it.

**Impact:** customers can pay without giving the system a delivery destination. The checkout can create an order the business cannot fulfill. The address fields also imply that the information is being captured when it is not.

**Required before launch:** implement and validate a shipping-address flow; persist the address with the verified order; show it in order/admin operations; cover the successful and failed checkout path with tests. Decide supported delivery regions, currency, shipping charges, and tax treatment before taking payments.

### P0 — Live Stripe configuration needs a guarded release check

**Evidence:** `backend/src/main/java/com/example/woodyzbackend/service/StripeService.java` now rejects PaymentIntent creation when the Stripe key is missing or is the mock placeholder. Compose permits the key to be omitted, and the checkout UI reports when online payments are unavailable.

**Impact:** customers cannot place online orders until live Stripe credentials are configured. The workflow checks the format of a provided frontend key but does not prove that the backend secret matches it or that the webhook is configured.

**Required before enabling live checkout:** owner verifies (without sharing secrets) that the backend has the intended live Stripe secret, frontend has the matching live publishable key, webhook endpoint has the matching signing secret, and a low-value real payment/order/refund rehearsal succeeds. Production startup should fail closed on missing or mock configuration.

### P1 — Visible controls and promotions do not perform the implied action

**Confirmed controls:**

- Header search button has an accessible name but no handler, form, or search destination (`components/Header.js`).
- “Mom’s Faves” and each “Quick Add” button in `components/Bestsellers.js` have no behavior. The bestseller cards also do not link to their corresponding product pages.
- Product detail wishlist button in `pages/products/[id].js` has no handler.
- Newsletter in `components/Newsletter.js` only shows a browser alert and clears the input. It does not call a subscription service, save consent, or issue the advertised 15% offer.
- Footer “Gift Card” points to `/checkout`; there is no gift-card page or purchase flow.
- Footer icon buttons with IDs `footer-social-ig`, `footer-social-pi`, and `footer-social-fb` point to email, products, and brand info rather than social profiles.

**Impact:** users receive false affordances and promotional promises. This harms conversion and trust, and blocks core navigation tasks such as searching or quick adding.

**Recommendation:** either connect each control to a real capability and test it, or render it as noninteractive content and remove unsupported discount/social/gift-card claims. Product category footer links currently all go to the unfiltered catalog; connect them to actual filters if category destinations are intended.

### P1 — Duplicate support widget appears on every page

**Evidence:** `components/Layout.js` renders `<SupportBubble />`, and `pages/_app.js` renders another one inside the same layout.

**Impact:** users get two floating support buttons and two independently stateful forms competing at the same screen position. This is especially confusing on narrow screens and the Manufacturing page.

**Recommendation:** choose one global owner for the widget, then verify one instance per route and viewport.

### P1 — Checkout has no useful payment-intent loading/error state

**Evidence:** `pages/checkout.js` logs payment-intent creation errors to the console, leaves `clientSecret` unset, and displays the same indefinite “Securing Payment Gateway” spinner. The Stripe form receives a USD total, and the displayed shipping inputs do not block payment.

**Impact:** a failed API or Stripe setup leaves customers stuck without an explanation or recovery action. Currency and delivery expectations also need a deliberate business decision for an India-based business.

**Recommendation:** expose a clear retryable error state, disable payment until all required checkout data exists, use a visible order total/currency label, and validate the flow at mobile widths.

### P1 — Customer order display uses today's date

**Evidence:** `pages/orders.js` formats `new Date()` in the order card instead of an order creation timestamp.

**Impact:** every historical order appears to have been placed today, which undermines the order history and creates support confusion.

**Recommendation:** add and return a server-controlled order creation time, then display that value with timezone-safe formatting.

### P1 — Account recovery and registration protections are missing

**Evidence:** current login/register routes provide username/email/password and basic required fields. The reviewed routes expose no password reset, email verification, or account recovery flow; the existing engineering review also tracks these gaps.

**Impact:** users who forget a password cannot recover access, and the business has limited protection against throwaway/spam accounts. Password strength policy and rate limiting require review.

**Recommendation:** decide whether guest checkout is needed; add a safe account recovery and verification path, rate-limit auth endpoints, and validate a documented password policy before scaling traffic.

## UI, UX, accessibility, and route review

### Shared site shell and navigation

- The desktop header presents a useful shop/category/impact/account/cart structure; the mobile menu has a toggle with `aria-expanded` and closes after navigation.
- At small widths, the mobile menu only offers “Join Club” pointing at registration; it omits login, profile, and logout actions. The desktop call to action points at login, so the two responsive experiences differ.
- The header's search control is inert. Add actual search or remove the control.
- The footer contains duplicated legal navigation and statements that need business confirmation: Bengaluru studio address and opening hours. Copyright says 2025 and is stale for the 2026 audit date.
- `Layout` gives generic global title/description metadata, while many pages add their own title. Shared defaults can cause duplicate or generic metadata when pages do not override them.
- `Layout` wraps all route content in a `<main>`, while Manufacturing and AdminLayout also render their own `<main>`. This creates nested main landmarks on those routes; keep one main landmark per document.
- `pages/_app.js` has visibly inconsistent indentation around global children; this is low-risk cleanup, but source formatting is not enforced by a linter.

### Product discovery and review interaction

- Catalog category chips filter the current loaded product list. The catalog is server-rendered and gracefully falls back to an empty list if the backend request fails, but the failure is logged only in the server console; visitors see an empty-state message that can imply there are no products.
- Homepage bestseller data is hard-coded and does not use product records, with external Unsplash images and dead quick-add controls. This can diverge from real inventory/prices.
- Product reviews render a fixed five-star display beside the numeric average, rather than visualizing the actual average. Star selection buttons have no accessible text/pressed state. Comment label is not programmatically associated with its textarea.
- Product detail wishlist is inert. Product images use plain `<img>` elements, including external sources, rather than Next image optimization. Actual performance impact is unmeasured.

### Forms, overlays, and status feedback

- Manufacturing form is the strongest form in the app: visible labels, client validation, `aria-invalid`, field-specific errors, submit loading state, generic server failure message, and a success receipt restricted to ID/status/time. Its focused validation tests pass.
- The quote admin page uses the shared ADMIN guard, displays a bounded recent list, has refresh/retry/error/empty states, and marks its page noindex. It has no search, pagination, or status-management action; only the newest 50 records can be reviewed.
- `SupportBubble` has no accessible name/state on its floating icon button, close button is icon-only, and the popup is not a dialog with focus management. Errors use `alert()` and success relies on animation/copy. Duplicate mounting magnifies these issues.
- Profile edit uses an unlabeled icon-only trigger/close, modal backdrop click, and no dialog semantics, focus trap, Escape behavior, or focus return. The phone/address labels lack `htmlFor`/input IDs.
- The login/register pages provide basic labels and required fields but errors are not consistently announced with `role=alert`; submit loading states and recovery links are absent.
- Cookie choices persist in local storage, but no optional analytics provider is wired to consent. The copy says optional analytics is not loaded unless configured and accepted; verify privacy copy and consent behavior match what is actually deployed.
- Several pages use `alert()`/`confirm()` and console-only errors. Replace with consistent inline status/retry UX for customer tasks.

### Visual design and responsive readiness

The Toys experience uses rounded cards, thick outlines, earthy color tokens, and repeated hover/press effects. Manufacturing has a separate dark/amber B2B presentation and is intentionally distinct. This code review cannot confirm visual quality, responsive overflow, touch target sizes, actual color contrast, focus visibility, animation comfort, or screen-reader behavior because browser screenshots and device interaction were unavailable. These are outstanding acceptance checks, not confirmed defects.

## SEO status

### Present in source

- Shared `components/Seo.js` supports title, description, canonical, robots, Open Graph, and Twitter metadata.
- Home and product detail pages include structured data; the home graph has Organization/WebSite, product detail emits Product JSON-LD.
- XML sitemap, HTML sitemap, `robots.txt`, and `llms.txt` routes exist and use `NEXT_PUBLIC_SITE_URL`.
- The catalog has server-side rendering for product content, and dynamic product pages have dedicated metadata.

### Gaps and risks

- `Seo` defaults social sharing imagery to `/favicon.ico`, which is not an adequate product/brand share card. Add a real brand Open Graph image and product-specific image metadata.
- Product catalog imports `Seo` and also emits another `<Head>` title/description, creating duplicate metadata definitions that can collide.
- Searchable public pages such as `/manufacturing` are missing from `sitemap.xml`'s static URL list. The map also does not include `/llms.txt`; prioritize actual landing pages and exclude utility URLs as appropriate.
- Auth, cart, checkout, profile, orders, tracking, and admin pages mostly use title-only metadata or shared generic metadata and lack explicit `noindex`. `robots.txt` disallows several paths, but robots exclusion alone does not reliably keep URLs out of an index; use page-level noindex for private/account/transaction routes.
- Dynamic product metadata must be checked for missing product data, canonical correctness, JSON-LD validity, and escaping of values. Static source inspection cannot prove the actual generated tags for each database record.
- Core commercial and public routes need unique descriptions and canonical tags; privacy/terms/site-map currently have canonical and description source, while many transactional routes do not.
- Browser rendering, actual search indexing, sitemap HTTP output against production data, Search Console status, and SEO crawls remain unverified because live fetch failed and no browser/search-console connection was available.

## Code quality, SOLID, and testability

### Strengths

- Backend separation follows controller/service/repository/entity/DTO boundaries, especially the Manufacturing quote vertical slice.
- Quote input DTO is separate from its persistence entity; client data cannot set quote ID/status/creation time through the DTO. Public and admin response models differ.
- The quote service sets server status and delegates bounded newest-first retrieval; tests cover validation/security via HTTP and service behavior.
- Frontend has reusable API, auth guard, SEO helper, form-field, and AdminLayout components. `AdminLayout` consolidates shared admin navigation.
- `reactStrictMode` is enabled. API wrapper centralizes token attachment and 401 handling.

### Maintainability issues

- Many page components own fetching, validation/business decisions, state transitions, and markup in one file. This is most visible in checkout, profile, admin inventory, support, and reviews. Extract domain/API hooks and presentational pieces when fixing these flows, not as a wholesale rewrite.
- Frontend lint/format enforcement is missing. Add ESLint/Prettier or an equivalent CI check and fix existing findings incrementally. There are inconsistent comments/indentation and stale JSDoc: `AdminLayout` documentation claims a limited set of admin pages and a prior duplication count that no longer matches the current nav.
- `Header` duplicates navigation markup for desktop and mobile. This is manageable now but can drift, as account actions already differ.
- Several endpoints serialize persistence entities directly (`Product`, `Order`, `Review`, `SupportTicket`). DTOs should define stable public fields and prevent accidental disclosure as entities evolve. In particular, an order response currently includes `paymentIntentId`, customer email/address, and internal IDs to its authorized owner/admin; check whether each field is necessary for each response.
- Backend uses field injection in several older controllers/services while newer quote code uses constructor injection. Standardize on constructor injection for testability and immutable dependencies.
- `ProductService` returns `null` for a missing product; API should provide a consistent 404/error contract rather than a successful null response.

## System design and security review

### Architecture observed

Next.js Pages Router renders the storefront/admin UI and calls a stateless Spring Boot REST API. The backend uses Spring Security/JWT, JPA/Hibernate, PostgreSQL in Compose, Redis dependencies/configuration, Stripe, and SendGrid configuration. The public quote API is separate from Toys orders/payments. Compose currently binds app/database/cache ports to loopback and expects a platform/reverse proxy for public ingress.

### Positive controls

- Stateless security configuration and role-based ADMIN restrictions exist; the quote listing is protected server-side, not only by the frontend guard.
- Public quote response is limited to ID/status/timestamp; the listing is capped at 50 newest rows.
- Payment amount is calculated from server-side product prices and has Stripe idempotency support per existing engineering review.
- HSTS, frame denial, MIME sniffing protection, Referrer-Policy, Permissions-Policy, and CSP are configured across the frontend/backend stack (provider edge behavior still needs verification).
- Database and JWT secrets are environment-driven in configuration; Compose does not publish service ports on all interfaces.

### Risks and launch controls

- JWT is kept in browser `localStorage`, so any successful script injection can read it. The CSP currently permits inline scripts; plan a nonce/hash CSP and/or HttpOnly cookie migration with an explicit CSRF design.
- Public support and Manufacturing quote endpoints have no visible rate limiting/CAPTCHA or duplicate-submission throttle. Quote data is personal contact information and free text; define retention, deletion, access logging, and spam handling.
- `spring.jpa.hibernate.ddl-auto=update` remains in application defaults and Compose. Production schema changes have no reviewed migration history/rollback rehearsal. Add migrations and rehearse against a PostgreSQL backup before launch.
- Default datasource is file-backed H2, while Compose uses PostgreSQL; production must explicitly set PostgreSQL environment variables. Do not start a live site on accidental H2 defaults.
- `PaymentController` includes exception details in a client-visible error string. Return a generic public error and log a correlation ID/server-side detail instead.
- Frontend and backend lack comprehensive API contract/e2e tests. The current suite is focused and passing, but does not establish full cart-to-fulfillment behavior, production PostgreSQL behavior, DNS/TLS, or access controls after deployment.
- Quote listing has no paging/search/status updates, and data retention is unspecified. The 50-record cap is useful for MVP but can make older requests inaccessible from the UI.
- Existing `ENGINEERING_REVIEW.md` records additional deployment and payment gates: no configured production provider/service, no proven backups/restore, no public smoke test, no payment fulfillment from webhook, no inventory/stock enforcement, Spring Boot 2.7.18 support lifecycle decision, and production deployment still requires owner-managed variables/DNS/TLS. These are launch gates and should remain tracked separately from visual polish.

## Route inventory reviewed

`/`, `/products`, `/products/[id]`, `/cart`, `/checkout`, `/profile`, `/orders`, `/track/[id]`, `/auth/login`, `/auth/register`, `/admin`, `/admin/analytics`, `/admin/config`, `/admin/coupons`, `/admin/support`, `/admin/users`, `/admin/manufacturing-quotes`, `/manufacturing`, `/ai`, `/privacy-policy`, `/terms-and-conditions`, `/sitemap`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/404`, and `/api/hello`.

## Recommended remediation order

1. Complete the shipping-address/payment/order path and verify live Stripe secrets/webhook before accepting orders.
2. Remove or implement dead controls; stop claiming newsletter discount/social/gift-card functionality until it works; fix duplicate support widget and order date.
3. Add consistent user-facing errors/loading/retry states to checkout, catalog, account, and support flows.
4. Apply accessibility fixes to icon controls, stars, modals, mobile account navigation, field labels, focus states, and keyboard behavior; then run browser-based desktop/mobile and screen-reader checks.
5. Complete SEO tags: page-level noindex for transactional/private pages, remove duplicate catalog metadata, add manufacturing sitemap URL, and provide real OG/share imagery. Confirm live output in Search Console and crawlers.
6. Add rate limits and personal-data retention controls to public support/quote endpoints; review DTO boundaries and client-visible exception details.
7. Add database migration/rollback and backup/restore rehearsal; provision the chosen host and run an external HTTPS smoke test.
8. Establish lint/format checks and browser e2e coverage for customer checkout, manufacturing quote submission, admin listing authorization, and mobile navigation.

## Owner decisions required

- Confirm supported shipping locations, shipping/tax calculation, order currency (current UI/backend payment intent use USD), return policy, and live fulfillment process.
- Confirm which real social links, gift cards, newsletter provider/discount, analytics provider, studio address/hours, and certification/product-safety claims are approved for public display.
- Confirm account policy (guest checkout, verification, recovery), quote/contact retention period, spam handling, and who can access/administer quote data.
- Confirm production hosting, API hostname, budget, payment/live test procedure, and deployment owner. Do not share secrets in chat.

## Limits

No source-code cleanup or feature fix was made during this audit. Screenshot-based visual inspection, screen-reader/keyboard testing, live production route checks, domain/DNS/TLS, Core Web Vitals, Search Console indexing, and cloud/provider configuration were not verified in this session.

# Pre-Release Checklist

This checklist is tailored to the current state of the project, highlighting areas that need verification before a release.

## Production Go/No-Go Register (checked 2026-10-23)

These items are not verified by local builds. Resolve them on the selected production provider before sending public traffic.

| Decision / evidence required | Current status | Release impact |
| --- | --- | --- |
| Hosting provider, API domain, DNS/TLS ownership, and deployment operator | **RECOMMENDATION MADE; OWNER SETUP REQUIRED** | Railway Pro is recommended for managed deployment and low server-maintenance effort; no account/services are configured. GoDaddy is the registrar and `https://woodyz.in` is the confirmed canonical site origin. Confirm authoritative nameservers, approve monthly budget/usage cap, confirm `api.woodyz.in`, and resolve apex-domain compatibility before editing DNS. Railway ingress/TLS must pass a staging smoke test before launch. |
| Railway frontend variables and GitHub image-workflow variables/secrets | **UNKNOWN** | Railway needs the three frontend values for its Docker build. The existing GitHub Actions workflow separately requires its existing variables and Docker Hub credentials to publish images; it does not deploy to Railway. Frontend values are compiled into the image. |
| Spring Boot runtime support | **COMMUNITY SUPPORT ENDED; COMMERCIAL CONTRACT UNKNOWN** | The project uses Spring Boot 2.7.18. Spring says 2.7.18 ended open-source support in November 2023; commercial support was extended through the end of 2026. Confirm a valid commercial support arrangement or approve a framework upgrade plan before launch. [Spring release note](https://spring.io/blog/2023/11/23/spring-boot-2-7-18-available-now/), [support extension](https://spring.io/blog/2024/09/27/spring-boot-2-7-support-period-extended/). |
| Runtime secrets (`POSTGRES_PASSWORD`, strong `APP_JWT_SECRET`, Stripe secret/webhook keys as applicable, SendGrid key) and initial ADMIN provisioning | **UNKNOWN** | Compose supports explicit ADMIN bootstrap variables; provider-side values and successful login still need verification. For live Toys checkout, verify privately that backend `STRIPE_API_KEY` starts with `sk_live_` and belongs to the same Stripe account as frontend `pk_live_`; the backend returns a mock PaymentIntent for a missing key or a key beginning `sk_test_mock`. Never put secret values in source control or chat; remove the bootstrap password after creation. |
| Production PostgreSQL backup plus rehearsal of Hibernate `ddl-auto=update`, quote table creation, and existing order uniqueness constraints | **NOT RUN** | Do not deploy schema changes against the live database before backup and rehearsal; application rollback does not reverse schema changes. |
| Production product catalog load/import | **UNKNOWN** | Demo catalog seeding is disabled by default; load and verify real product, price, and image data before opening the Toys storefront. |
| Official privacy, shipping, return/refund, tax, cancellation, and commercial terms plus legal review | **INCOMPLETE** | Current policy pages explicitly say administrator contact, shipping, refund, and other commercial terms are not configured. Replace placeholders with owner-approved policy and contact details before accepting customer orders or collecting quote leads. |
| Authentic WOODYZ Manufacturing project examples/photos | **NOT PROVIDED IN REPOSITORY** | The page explains capabilities and product categories but has no verified project portfolio. Supply approved project examples or explicitly accept a launch without portfolio proof; do not present toy-store photos or invented client work as manufacturing projects. |
| Live-payment behavior and Stripe webhook fulfillment/reconciliation | **NOT VERIFIED; KNOWN LIMITATION** | Webhook receipt verification/deduplication exists, but it does not reconcile payment state or fulfill orders; inventory is not enforced. Do not promise reliable order fulfillment until this is addressed or explicitly accepted. |
| Quote intake throttling, contact-data retention, and privacy handling | **NOT CONFIGURED** | Public form can be abused and stores personal contact/project data; configure edge/API throttling and a retention/access policy before promotion. |

The current local evidence is limited to passing backend/frontend tests, production builds, prior local Docker image builds, and Compose configuration validation. These do not count as a staging or production deployment. On 2026-10-23, backend Maven verification passed with 26 tests, Manufacturing form tests passed with 5, Python QA safety tests passed with 3, and the Next.js production build passed using the intended site origin and a validation-only API origin. A fresh Docker check could not access the Docker engine, and npm audit could not resolve `registry.npmjs.org`; earlier local Docker builds and an npm production audit passed on 2026-10-22, so those checks need rerunning when the services/network are available.

## Four-Day Launch Sequence (Updated 2026-10-23; Target: 2026-10-26)

### Day 1 — 2026-10-23: Lock the release target and build

- [ ] Confirm Railway as the production host, open the owner-controlled account, approve a monthly budget alert/limit, identify authoritative GoDaddy nameservers, confirm `api.woodyz.in`, and decide apex/`www` behavior. GoDaddy registrar and canonical site origin `https://woodyz.in` are confirmed.
- [ ] Check Railway service region choices and estimated resource usage after a staging deployment. Current Pro minimum is $20/month including $20 resource usage; usage above the included amount costs extra. A hard limit shuts workloads down when reached.
- [ ] Confirm whether launch includes live Toys checkout and Manufacturing quote intake, or whether either flow should be held back.
- [ ] Review the current uncommitted changes and select the release commit; CI only builds/publishes after changes are committed and pushed to `main` or `master`.

### Day 2 — 2026-10-24: Stage infrastructure

- [ ] Create Railway PostgreSQL and frontend/backend services from the existing Dockerfiles. Set roots to `/woodyz-frontend` and `/backend`; confirm service start and private networking.
- [ ] Set the frontend build values `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; verify the generated CSP permits the final API origin. Set backend `FRONTEND_ORIGIN` to the final site origin.
- [ ] Set JWT, database, Stripe, SendGrid, admin-bootstrap, and seed configuration through Railway Variables. Keep demo seeding off and remove the bootstrap password after creating the first ADMIN.
- [ ] Test without Redis only if the application starts and passes the staging smoke suite with its current `simple` cache mode; add Redis if runtime evidence requires it.
- [ ] Back up PostgreSQL and rehearse `manufacturing_quote_requests` schema creation before production. Enable scheduled database backups, test restoration, and keep an independent logical export.
- [ ] Attach persistent storage for `/app/data/uploads` if backend uploads are used; include it in backup/restore checks.
- [ ] Check Railway logs, restart behavior, service health, and external uptime monitoring. Do not switch DNS until app/API tests pass on temporary domains.

### Day 3 — 2026-10-25: Run end-to-end acceptance and close release risks

- [ ] Test Toys registration/login, product browsing, cart, Stripe test-mode payment, order creation, and order history.
- [ ] Test public quote validation/submission and verify the ADMIN-only inbox access.
- [ ] Check mobile layout, error/loading states, SEO/canonical URLs, and browser console/network errors on the target domains.

- [ ] Confirm backup restore and Railway deployment rollback procedure in staging.
- [ ] Restore-test a backup that includes the database and uploaded files, and document what happens to quote data if the application image is rolled back.
- [ ] Configure quote endpoint abuse throttling and agree on handling/retention of submitted contact data.
- [ ] Verify production secrets, exact CORS origin, HTTPS, Stripe webhook endpoint/secret if enabled, and admin provisioning.
- [ ] Confirm `APP_SEED_DEMO_DATA=false` in production; enable it only for an isolated demo database.
- [ ] Review remaining known limitations: no inventory enforcement; webhook receipts do not reconcile or fulfill orders.

### Day 4 — 2026-10-26: Release and monitor

- [ ] Deploy the reviewed commit/image tags to production and verify database and service health.
- [ ] Run smoke tests for both Toys and Manufacturing routes, including one quote and one payment test approved for production.
- [ ] Monitor application, database, payment, and email logs; keep the previous image tags and database backup available.

## 1. Code & Build Validation

- [x] Backend `mvn -B -f backend/pom.xml verify` passed on 2026-10-23 (26 tests; executable JAR packaged).
- [x] Frontend production build `npm run build` passed on 2026-10-23 using Webpack and validation-only API/Stripe values. There is no frontend lint script configured; do not treat the Next.js 16 build as a lint run.
- [x] Manufacturing quote validation tests passed (5) and Python QA safety tests passed (3) on 2026-10-23. Backend quote/security tests are included in the 26-test Maven verification.
- [ ] Rerun `npm audit --omit=dev` when the npm registry is reachable; on 2026-10-23 the registry hostname could not be resolved. The audit passed with zero production advisories on 2026-10-22.
- [ ] Rerun Docker image/Compose checks when Docker Engine access is available. Prior local image builds and runtime smoke checks passed on 2026-10-22; this session could not access Docker Desktop on 2026-10-23.
- [ ] GitHub Actions backend Maven verification, Python QA safety tests, frontend production dependency audit, Manufacturing quote validation tests, and frontend/backend image publishing pass.
- [ ] Run `backend/test_suite.py` only against local or isolated staging data. Remote mutations require `WOODYZ_ALLOW_REMOTE_MUTATIONS=1`; real payment creation also requires `RUN_LIVE_PAYMENT=1` and `WOODYZ_ALLOW_LIVE_PAYMENT=1`. Never run it against production.

## 2. Environment & Secrets

- [ ] All required secrets are available in the target environment:
  - `POSTGRES_PASSWORD`
  - `APP_JWT_SECRET`
  - `STRIPE_API_KEY`
  - `STRIPE_WEBHOOK_SECRET` (required if webhook delivery is enabled)
  - `SENDGRID_API_KEY`
- [ ] Frontend environment variables (e.g., `NEXT_PUBLIC_API_URL`) are correctly pointing to the production domain.
- [ ] GitHub repository variable `NEXT_PUBLIC_API_URL` is set to the production HTTPS API origin; the image build now fails if it is missing.
- [ ] GitHub repository variables `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are set; the production workflow requires HTTPS and a `pk_live_` key before publishing.

## 3. Database & Migrations

- [ ] **CRITICAL:** Review Entity changes. Since `SPRING_JPA_HIBERNATE_DDL_AUTO: update` is used, ensure that new code will not corrupt or conflict with existing production data.
- [ ] Before deploying the PaymentIntent uniqueness constraint, confirm there are no duplicate non-null `orders.payment_intent_id` values in the database.
- [ ] Review `manufacturing_quote_requests` against the target PostgreSQL version; back up and rehearse table creation/rollback on a production-like copy. Hibernate `ddl-auto=update` is not a formal migration plan.
- [ ] Take a manual backup of the PostgreSQL database before deploying.

## 4. API & Compatibility

- [ ] Ensure frontend changes are compatible with the backend API version being deployed.
- [ ] Confirm public quote POST returns only request ID/status/timestamp and invalid input gets controlled 400 responses.
- [ ] Confirm anonymous and non-admin callers cannot access quote listing; verify ADMIN access and newest-50 cap.
- [ ] Define abuse throttling and contact-data retention/access policy before broad public promotion.
- [ ] Verify frontend Docker build has the correct `NEXT_PUBLIC_API_URL` injected at build time.
- [ ] Verify browser CSP and backend CORS against the exact production API and site origins.

## 5. Deployment Execution

- [ ] Confirm the reviewed commit passed GitHub Actions before deploying it to Railway. Keep deployment manual until CI gating is verified.
- [ ] Deploy the same reviewed commit to Railway backend and frontend services; record the Railway deployment IDs and keep the previous successful deployments available for rollback.

## 6. Post-Deployment & Health Checks

- [ ] Verify Frontend is accessible and loading correctly.
- [ ] Verify Backend API is responding (check login/authentication flow).
- [ ] Verify Database connection (check logs for Hibernate errors).
- [ ] Confirm PostgreSQL and any Redis service are private and not exposed through public networking.
- [ ] Verify only the approved website and API hostnames respond publicly over HTTPS; do not expose database ports.
- [ ] Verify 3rd party integrations (Stripe, Sendgrid).
- [ ] Submit a quote through `/manufacturing`, confirm it appears in the admin inbox, and confirm no order/payment is created.
- [ ] When webhooks are enabled, configure the Stripe endpoint secret and verify signed delivery reaches `POST /api/payments/webhook`.
- [ ] Check Docker logs for any crash loops (`docker-compose logs -f`).

## 7. Rollback Readiness

- [ ] Record the previous working commit SHA and confirm matching backend/frontend images are available.
- [ ] In Railway, roll the frontend and backend services back to the previous successful deployment and verify that both correspond to a compatible application release.
- [ ] Confirm database backup is accessible for restoration if schema corruption occurs.

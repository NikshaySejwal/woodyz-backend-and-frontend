# Deployment Architecture & Process

## Current Deployment Setup

Based on the existing codebase, `docker-compose.yml` is the local development and self-managed-host orchestration path. Railway Pro is the recommended managed host, but it is not configured yet.

The same Next.js deployment hosts the separate WOODYZ Toys storefront and WOODYZ Manufacturing B2B experience. Manufacturing quote submission calls `POST /api/manufacturing/quotes`; the admin inbox calls `GET /api/manufacturing/quotes/admin`. Set `NEXT_PUBLIC_API_URL` and `FRONTEND_ORIGIN` to the actual deployment origins. Public submission requires no token; listing requires an existing ADMIN JWT.

## Recommended Hosting: Railway

The owner wants low cost and simple operation without managing an Oracle VM or Linux server. Railway is the recommended first host: it deploys Dockerfiles from GitHub, provides PostgreSQL as a service, and automatically provisions HTTPS for custom domains. It is a managed platform rather than one virtual machine; the owner still controls application configuration, secrets, database backups, and release decisions. [Railway services](https://docs.railway.com/services) [Railway Docker Compose guide](https://docs.railway.com/guides/docker-compose) [Railway domains](https://docs.railway.com/networking/domains/working-with-domains)

Use Railway Pro for the commercial storefront. Current listed price is a $20/month minimum that includes $20 of resource usage; usage above that is billed extra, so $20 is not a guaranteed total. After staging, check estimated usage and configure an email alert and an owner-approved hard limit. A hard limit takes workloads offline when reached. [Railway pricing](https://railway.com/pricing) [Railway cost controls](https://docs.railway.com/pricing/cost-control)

Create separate Railway services for the frontend and backend from their existing Dockerfiles, and use Railway PostgreSQL. The local Compose file also includes Redis; the application defaults to the in-memory `simple` cache. Confirm with a staging smoke test before omitting Redis. Railway's Compose importer does not support every Compose option; review imported services rather than assuming local `depends_on`, ports, or bind mounts work unchanged. [Railway Docker Compose guide](https://docs.railway.com/guides/docker-compose)

Set the frontend service root to `/woodyz-frontend` and backend root to `/backend`. Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` on the frontend service; these are build-time public values and changing them requires a rebuild. Set backend runtime values in Railway, including database connection values, a non-superuser database role that owns the application tables, `APP_RLS_ENABLED=true`, `APP_RATE_LIMIT_ENABLED=true`, `APP_REQUIRE_HTTPS=true`, `APP_JWT_SECRET`, `SUPPORT_ENCRYPTION_KEY`, `STRIPE_API_KEY`, `SENDGRID_API_KEY`, `FRONTEND_ORIGIN=https://woodyz.in`, and `APP_SEED_DEMO_DATA=false`. Provision Redis as a private service; the API returns 503 when rate-limit storage is unavailable. Use private database connections and Railway variable references. Never put secrets in Git or chat. `SPRING_JPA_HIBERNATE_DDL_AUTO=update` still needs backup and schema rehearsal before launch.

GoDaddy is the registrar and `https://woodyz.in` is the confirmed canonical site origin. `https://api.woodyz.in` is the recommended API origin, pending final owner confirmation. Verify authoritative nameservers first, then add the exact routing and TXT verification records shown in Railway to the active DNS provider. Railway provisions HTTPS after domain verification. For an apex/root domain, Railway requires CNAME flattening, ALIAS, or ANAME support. If GoDaddy's DNS zone cannot provide a compatible root record, use `www.woodyz.in` as the site hostname and GoDaddy HTTPS forwarding from the apex, then set the canonical site URL to `https://www.woodyz.in`. Do not change DNS until Railway temporary domains pass smoke tests and the hostname behavior is agreed. [Railway domain requirements](https://docs.railway.com/networking/domains/working-with-domains) [GoDaddy DNS records](https://www.godaddy.com/en-in/help/manage-dns-records-680)

The current GitHub workflow verifies and publishes Docker Hub images; it does not deploy them. Railway can build from the GitHub repository directly. Before enabling automatic Railway deployments, configure its GitHub check-suite gate so deployments wait for the repository workflow to pass. The existing workflow also requires its current Docker Hub credentials to pass the image-publishing step. [Railway Dockerfiles](https://docs.railway.com/builds/dockerfiles) [Railway production readiness](https://docs.railway.com/overview/production-readiness-checklist)

### Local Compose Services (Development and Existing Image-Based Host Path)

1. **db**: `postgres:15-alpine` (with persistent volume `postgres_data`)
2. **redis**: `redis:7-alpine`
3. **backend**: Spring Boot app, built from `./backend`, depends on `db` and `redis`.
4. **frontend**: Next.js app, built from `./woodyz-frontend` locally or selected from `FRONTEND_IMAGE`, depends on `backend`.

PostgreSQL and Redis have health checks; the backend waits until both report healthy before starting. The backend and frontend do not currently have container health checks. Compose binds PostgreSQL, Redis, frontend, and API host ports to `127.0.0.1`. These settings apply to local development and the existing Compose host path; Railway provides its own ingress and service networking, so do not copy Compose port or reverse-proxy instructions into Railway configuration.

Compose supports explicit `BACKEND_IMAGE` and `FRONTEND_IMAGE` tags. Local development defaults to `woodyz-backend:local` and `woodyz-frontend:local` and builds from source. For a self-managed Compose host, set both variables to the same commit's Docker Hub SHA tags, then pull and run with `--no-build`. On Railway, build from the two repository Dockerfiles. The frontend API/site URLs and Stripe publishable key are compiled into its image; changing them requires a rebuild.

## Railway Deployment Prerequisites

- Railway account on the Pro plan and an owner-approved monthly usage alert/limit.
- GitHub repository connected to Railway, with frontend and backend services rooted at `/woodyz-frontend` and `/backend`, plus a Railway PostgreSQL service.
- Set runtime secrets only in Railway Variables. Required application values include `APP_JWT_SECRET`, `STRIPE_API_KEY`, and `SENDGRID_API_KEY`; configure `STRIPE_WEBHOOK_SECRET` only when enabling webhook delivery. Create the initial ADMIN through the existing first-run bootstrap variables, then remove the bootstrap password.
- Set Spring datasource variables to the Railway PostgreSQL service's private connection details. Do not expose PostgreSQL publicly.
- Attach persistent storage at `/app/data/uploads` if backend product uploads are in use; verify backup and restore behavior for this data.

`APP_SEED_DEMO_DATA` defaults to `false`, so a new production database is not populated with sample products or a fake shipped order. Set it to `true` only for an isolated local/demo database. Admin creation is separate and occurs only when both `ADMIN_USERNAME` and `ADMIN_PASSWORD` are provided and the username is not already present.

## Railway First Deployment Steps

Validate against temporary Railway domains before adding GoDaddy domains:

1. Connect the GitHub repository and create frontend, backend, and PostgreSQL services. Set the app-service root directories to `/woodyz-frontend` and `/backend` so Railway uses the existing Dockerfiles.
2. Set frontend build values to the final HTTPS site/API origins and live Stripe publishable key. Set backend runtime variables and private PostgreSQL references. Keep demo seeding disabled.
3. Deploy, inspect service logs, and check the database connection, login/admin access, quote submission/listing permissions, and Toys checkout using Stripe test mode.
4. Enable PostgreSQL backups and rehearse a restore. Attach a persistent volume for `/app/data/uploads` if uploads are used.
5. Add `api.woodyz.in` to the backend and the agreed site hostname to the frontend. Copy the exact routing and TXT verification records shown by Railway into the authoritative DNS zone. Wait for domain verification and HTTPS.
6. Rebuild the frontend after changing any public URL and repeat site/API/CSP smoke tests. Enable Railway's wait-for-CI check gate before enabling automatic deployments.

Railway database backups and point-in-time recovery must be explicitly enabled and tested. Keep an independent logical database export as an additional recovery path. [Railway PostgreSQL backups](https://docs.railway.com/guides/postgres-backups-restores)

To enable Stripe webhook delivery, configure the Stripe Dashboard endpoint as the deployment's public HTTPS URL ending in `/api/payments/webhook`, subscribe to the needed PaymentIntent events, and provide that endpoint's signing secret as `STRIPE_WEBHOOK_SECRET`. Without the secret, the endpoint returns HTTP 503. The current handler verifies and deduplicates event receipts but does not fulfill orders.

## Common Deployment Failure Points

- **Missing Secrets**: The `docker-compose.yml` uses bash parameter expansion (e.g., `${POSTGRES_PASSWORD:?must be set}`) which will immediately fail the deployment if these environment variables are missing.
- **Database Migrations**: The backend relies on `SPRING_JPA_HIBERNATE_DDL_AUTO: update`. This is highly risky for production deployments as it attempts to automatically alter the database schema to match entity models, which can fail or cause data loss on complex changes.
- **Manufacturing quote table**: The quote feature adds `manufacturing_quote_requests`. Back up PostgreSQL and verify generated columns and rollback compatibility before first production rollout; `ddl-auto=update` is not a reviewed migration process.
- **Quote data and abuse**: Quote requests store contact details and project messages. The MVP has no rate limiting/CAPTCHA or retention policy; add edge/API throttling and define access/retention before broadly promoting the form.

## Unknowns / Needs Confirmation

The consolidated production go/no-go register, including owner actions and technical gates, is maintained in [`release-checklist.md`](release-checklist.md#production-go-no-go-register-checked-2026-10-23). Do not treat local container builds as deployment verification.

- **Production Hosting**: Railway Pro is recommended but not provisioned. Account, budget limit, service configuration, region, and production deployment are **UNKNOWN**.
- **Production CI/CD**: GitHub Actions verifies backend Maven tests, manual-QA safety tests, and frontend quote tests, then publishes Docker Hub images. It does not deploy them. Railway repository builds are a separate deployment path and must be gated by a passing CI run.
- **Backend Deployment**: Railway service configuration, private PostgreSQL wiring, persistent upload storage, backups, and deployment execution remain unverified.
- **Domain/TLS**: Railway provisions HTTPS after routing and TXT verification records are added at the authoritative DNS provider. The owner must verify GoDaddy nameservers and root-domain compatibility before editing DNS.

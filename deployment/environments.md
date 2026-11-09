# Environment Configuration

Based on the project structure and `docker-compose.yml`, this document outlines the environment setup.

## Services & Dependencies

- **Database**: PostgreSQL (image: `postgres:15-alpine`)
- **Cache**: Redis is present in local Compose; Spring's configured default cache is in-memory `simple`. Verify whether Redis is needed before adding a separate hosted Redis service.
- **Backend**: Spring Boot (Java 25 runtime, Java 21 bytecode target, Maven)
- **Frontend**: Next.js (Node 20)

The separate Manufacturing B2B route (`/manufacturing`) is served by the same frontend app and uses the same backend base URL. Its admin inbox uses existing JWT authentication and ADMIN role configuration.

## Environment Variables

### Backend

Configured in `docker-compose.yml`:

- `POSTGRES_PASSWORD`: Required.
- `APP_DB_PASSWORD`: Required by Compose. Password for the non-superuser `woodyz_app` database role used by the backend. Compose creates this role only when PostgreSQL initializes a new data volume; existing databases need a reviewed, backed-up ownership/role migration before switching the backend connection.
- `APP_JWT_SECRET`: Required. For JSON Web Token signing.
- `SUPPORT_ENCRYPTION_KEY`: Required. Use a secret-managed, random value of at least 32 bytes for support-message encryption. Existing messages encrypted with the previous development fallback must be migrated before deploying this requirement.
- `APP_RLS_ENABLED`: Required as `true` in production. Enables PostgreSQL row-level policies for users, orders, order history, support tickets, reviews, products, quotes, coupons, webhook records, and admin audit events. The database role must be a non-superuser without `BYPASSRLS` and must own the relevant tables so the app can install/force policies.
- `APP_RATE_LIMIT_ENABLED`: Keep `true` in production. Redis is required; failures return 503 rather than silently disabling limits. Limits are 5 login/signup requests per 15 minutes per IP, 10 public support/quote submissions per 15 minutes per IP, and 120 API requests per minute per authenticated user (anonymous API traffic is grouped by IP).
- `APP_REQUIRE_HTTPS`: Keep `true` in production. The hosting ingress must terminate TLS, redirect any public HTTP traffic, block direct public backend access, and strip/overwrite forwarded-protocol headers before forwarding requests.
- `APP_CORS_ALLOW_HTTP_LOCALHOST`: Leave `false` in production. Set `true` only for local development when the exact configured origin is `http://localhost` or `http://127.0.0.1`.
- `STRIPE_API_KEY`: Optional while checkout is disabled. Set a valid Stripe secret key to enable payment processing; without it, payment-intent requests return 503 and checkout is unavailable.
- `STRIPE_WEBHOOK_SECRET`: Optional for local runs; required to enable signed Stripe webhook processing.
- `SENDGRID_API_KEY`: Required. For email services.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`: Optional first-run ADMIN bootstrap values. Use a unique username and strong password from the provider secret store; remove the bootstrap password after the account is created.
- `APP_SEED_DEMO_DATA`: Defaults to `false`. Set to `true` only for a local/demo database to insert the sample catalog and fake shipped order.
- `FRONTEND_ORIGIN`: Exact browser origin; the application defaults to `https://woodyz.in`. Local Compose defaults to `http://localhost:3000` with `APP_CORS_ALLOW_HTTP_LOCALHOST=true`; production must use the approved HTTPS origin (currently `https://woodyz.in`) with the local exception disabled. No wildcard, path, or credentials are allowed.
- Spring/DB config variables (`SPRING_DATASOURCE_*`, `SPRING_REDIS_*`).
- `SPRING_JPA_HIBERNATE_DDL_AUTO`: Set to `update`.
- `SPRING_JPA_SHOW_SQL`: Defaults to `false` to avoid noisy SQL output in production logs; enable only for local diagnosis.
- The quote entity adds `manufacturing_quote_requests`; production schema creation has not been verified and requires backup/review.

### Frontend

Configured in `docker-compose.yml`. The repository does not contain an `.env.example` template. Use an uncommitted `.env.production` file for local Compose or enter these values in the appropriate Railway service's Variables page; use private service references for the production database.

- `NEXT_PUBLIC_API_URL`: Backend API URL, compiled into the frontend image at build time. `http://localhost:8080` is a local-development default only; production is expected to use `https://api.woodyz.in`, pending owner confirmation and domain setup.
- `NEXT_PUBLIC_SITE_URL`: Frontend public URL. The owner confirmed `https://woodyz.in` as canonical; if GoDaddy DNS cannot connect the apex to Railway, decide whether to use `https://www.woodyz.in` and forward the apex before production builds.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Optional while checkout is disabled. Set the matching live publishable key when enabling Stripe checkout.
- `BACKEND_URL`: Server-side frontend-to-backend target. It is `http://backend:8080` in local Compose; on Railway, set it to the backend's private service URL.
- `BACKEND_IMAGE`, `FRONTEND_IMAGE`: Optional image references; local defaults build from source under `woodyz-backend:local` and `woodyz-frontend:local`.

For GitHub Actions production image builds, configure repository variables `NEXT_PUBLIC_API_URL` (public HTTPS API origin) and `NEXT_PUBLIC_SITE_URL` (public HTTPS storefront origin). `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is optional while checkout is disabled; when provided, it must be a live `pk_live_` key. These values are compiled into the frontend, and the API origin is added to the Content Security Policy.

The public Manufacturing form does not require authentication. Its admin inbox requires the existing bearer JWT and ADMIN role. No quote-specific environment variable is added.

Checkout sends a required UUID `Idempotency-Key` request header when creating a PaymentIntent. The browser retains the key per authenticated user/cart in `sessionStorage` so retrying the same cart reuses the same Stripe request identity.

## Environment Differences

- **Local/Development**: Managed entirely via `docker-compose.yml` which builds images from local source and mounts local volumes (e.g., `./data/uploads:/app/data/uploads`). PostgreSQL and Redis host ports bind to loopback only, and backend startup waits for both services' health checks.
- **Self-managed Compose image selection**: Set `BACKEND_IMAGE` and `FRONTEND_IMAGE` in the uncommitted `.env.production` file to the same reviewed commit SHA tags, then run `docker compose --env-file .env.production pull` and `docker compose --env-file .env.production up -d --no-build`. This is the existing VM/Compose path, not the recommended Railway setup.
- **Production origin/security wiring**: The CI frontend build uses `NEXT_PUBLIC_API_URL` to add the API origin to the Content Security Policy. The backend uses `FRONTEND_ORIGIN` for CORS. These must match the selected public API and site origins; setting only runtime `BACKEND_URL` does not change browser API requests or the compiled CSP.
- **Production/Staging**: **NOT CONFIGURED**. GoDaddy is the registrar and `https://woodyz.in` is the confirmed site origin. Railway Pro is recommended but not provisioned. `api.woodyz.in`, authoritative DNS records, service region, production variables, and backup settings remain unconfirmed. GitHub Actions publishes Docker Hub images but does not deploy them; Railway can build each Dockerfile from the connected repository.

## Secrets Handling

Secrets are passed as environment variables. The `docker-compose.yml` enforces that critical secrets like `POSTGRES_PASSWORD`, `APP_DB_PASSWORD`, `APP_JWT_SECRET`, `SUPPORT_ENCRYPTION_KEY`, and `SENDGRID_API_KEY` must be set in the host environment before running. `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET` are optional while Stripe payments are disabled; the webhook endpoint returns 503 until its secret is configured. Signed Stripe webhook events are verified before deduplication/recording.

Uploads are stored outside the static web root and are not exposed through Spring's directory resource handler. Only UUID-named images referenced by a product record are served publicly as storefront product images. Keep the upload volume private to the backend host; do not expose it through a CDN or web-server directory mapping.

Admin API requests are recorded in `admin_audit_log` with actor ID, action, resource category/ID, response status, and timestamp. Request bodies, query strings, and credentials are not recorded; events older than 365 days are removed daily.

Persistence uses Spring Data/JPA repository methods; do not introduce concatenated SQL. Any future native SQL must bind all values as parameters.

The current `/ai` route is informational and the backend has no AI model, agent, or tool-execution integration. Do not expose shell, database, file, payment, or administrative capabilities to an AI feature without an explicit allowlist, server-side authorization, and isolated execution.

## Verified vs Unknown

- **Verified**: Local development dependencies, required secrets, frontend/backend environment variable names.
- **Unknown**: Railway account and monthly budget, service region, public API domain, authoritative GoDaddy nameservers, root-domain compatibility, production variables, database backups, and deployment operator. Railway HTTPS setup and public runtime have not been tested.

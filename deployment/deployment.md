# Deployment Architecture & Process

## Current Deployment Setup

Based on the existing codebase, the primary mechanism for orchestration is `docker-compose.yml`.

### Services Involved:

1. **db**: `postgres:15-alpine` (with persistent volume `postgres_data`)
2. **redis**: `redis:7-alpine`
3. **backend**: Spring Boot app, built from `./backend`, depends on `db` and `redis`.
4. **frontend**: Next.js app, built from `./woodyz-frontend`, depends on `backend`.

## Deployment Prerequisites

- A host machine with Docker and Docker Compose installed.
- Required environment variables must be exported on the host before running the deployment command:
  - `POSTGRES_PASSWORD`
  - `APP_JWT_SECRET`
  - `STRIPE_API_KEY`
  - `STRIPE_WEBHOOK_SECRET` (required only when Stripe webhook delivery is enabled)
  - `SENDGRID_API_KEY`

## Verified Deployment Steps

For local/single-server deployment using the existing configuration:

1. Clone the repository.
2. Set the required environment variables.
3. Run `docker-compose up --build -d`.

To enable Stripe webhook delivery, configure the Stripe Dashboard endpoint as the deployment's public HTTPS URL ending in `/api/payments/webhook`, subscribe to the needed PaymentIntent events, and provide that endpoint's signing secret as `STRIPE_WEBHOOK_SECRET`. Without the secret, the endpoint returns HTTP 503. The current handler verifies and deduplicates event receipts but does not fulfill orders.

## Common Deployment Failure Points

- **Missing Secrets**: The `docker-compose.yml` uses bash parameter expansion (e.g., `${POSTGRES_PASSWORD:?must be set}`) which will immediately fail the deployment if these environment variables are missing.
- **Database Migrations**: The backend relies on `SPRING_JPA_HIBERNATE_DDL_AUTO: update`. This is highly risky for production deployments as it attempts to automatically alter the database schema to match entity models, which can fail or cause data loss on complex changes.

## Unknowns / Needs Confirmation

- **Production Hosting**: The actual production server/provider (e.g., AWS EC2, DigitalOcean Droplet, Vercel) is **UNKNOWN**.
- **Production CI/CD**: GitHub Actions verifies the backend Maven lifecycle and publishes backend/frontend images to Docker Hub tagged with `latest` and the commit SHA. It does not deploy them. How images are pulled and deployed to production is **UNKNOWN**.
- **Backend Deployment**: The backend image is now built and published by CI. The current Compose configuration still builds from source, so deployment must be configured to consume the published image tags before this pipeline can serve production.
- **Reverse Proxy / SSL**: There is no Nginx/Traefik configuration or SSL/TLS handling documented in the repository.

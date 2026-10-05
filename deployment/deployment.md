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
  - `SENDGRID_API_KEY`

## Verified Deployment Steps
For local/single-server deployment using the existing configuration:
1. Clone the repository.
2. Set the required environment variables.
3. Run `docker-compose up --build -d`.

## Common Deployment Failure Points
- **Missing Secrets**: The `docker-compose.yml` uses bash parameter expansion (e.g., `${POSTGRES_PASSWORD:?must be set}`) which will immediately fail the deployment if these environment variables are missing.
- **Database Migrations**: The backend relies on `SPRING_JPA_HIBERNATE_DDL_AUTO: update`. This is highly risky for production deployments as it attempts to automatically alter the database schema to match entity models, which can fail or cause data loss on complex changes.

## Unknowns / Needs Confirmation
- **Production Hosting**: The actual production server/provider (e.g., AWS EC2, DigitalOcean Droplet, Vercel) is **UNKNOWN**.
- **Production CI/CD**: The GitHub action only pushes the frontend image to Docker Hub (`woodyz-frontend:latest`). How this image is pulled and deployed to the production server is **UNKNOWN**.
- **Backend Deployment**: There is no automated build/push for the backend image. It is assumed it must be built directly on the server using `docker-compose`, which is not a standard production practice.
- **Reverse Proxy / SSL**: There is no Nginx/Traefik configuration or SSL/TLS handling documented in the repository.

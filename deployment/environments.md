# Environment Configuration

Based on the project structure and configuration files (`docker-compose.yml`, `.env.example`), this document outlines the environment setups.

## Services & Dependencies
- **Database**: PostgreSQL (image: `postgres:15-alpine`)
- **Cache/Session**: Redis (image: `redis:7-alpine`)
- **Backend**: Spring Boot (Java 17, Maven)
- **Frontend**: Next.js (Node 20)

## Environment Variables

### Backend
Configured in `docker-compose.yml`:
- `POSTGRES_PASSWORD`: Required.
- `APP_JWT_SECRET`: Required. For JSON Web Token signing.
- `STRIPE_API_KEY`: Required. For payment processing.
- `SENDGRID_API_KEY`: Required. For email services.
- `FRONTEND_ORIGIN`: Defaults to `http://localhost:3000`.
- Spring/DB config variables (`SPRING_DATASOURCE_*`, `SPRING_REDIS_*`).
- `SPRING_JPA_HIBERNATE_DDL_AUTO`: Set to `update`.

### Frontend
Configured in `docker-compose.yml` and `.env.example`:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:8080`).
- `NEXT_PUBLIC_SITE_URL`: Frontend public URL (e.g., `https://www.woodyz.in`).
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key.
- `BACKEND_URL`: Internal Docker network URL (`http://backend:8080`).

## Environment Differences
- **Local/Development**: Managed entirely via `docker-compose.yml` which builds images from local source and mounts local volumes (e.g., `./data/uploads:/app/data/uploads`).
- **Production/Staging**: **UNKNOWN / NEEDS CONFIRMATION**. There is no explicit staging or production configuration file present. The `deploy.yml` GitHub Action pushes a frontend image to Docker Hub, but how it is instantiated alongside the backend in production is unknown.

## Secrets Handling
Secrets are passed as environment variables. The `docker-compose.yml` enforces that critical secrets like `POSTGRES_PASSWORD`, `APP_JWT_SECRET`, `STRIPE_API_KEY`, and `SENDGRID_API_KEY` must be set in the host environment before running.

## Verified vs Unknown
- **Verified**: Local development dependencies, required secrets, frontend/backend environment variable names.
- **Unknown**: Production infrastructure (AWS, DigitalOcean, etc.), production SSL/TLS termination, secrets manager (if any) used in production.

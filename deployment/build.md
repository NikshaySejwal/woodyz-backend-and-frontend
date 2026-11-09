# Build Process

## Prerequisites

- Docker and Docker Compose (for local building and running)
- Java 25 / Maven (for local backend development without Docker)
- Node.js 20 / npm (for local frontend development without Docker)

## Backend Build

The backend uses Maven for dependency management and building.

**Verified Build Steps (from `backend/Dockerfile`):**

1. Uses `maven:3.9-eclipse-temurin-25` as the build environment. The backend is compiled for Java 21 for bytecode compatibility.
2. Copies `pom.xml` and `src/`.
3. Runs `mvn clean package -DskipTests` to build the JAR file.
4. The final artifact (`target/*.jar`) is copied into a lightweight `eclipse-temurin:25-jre-alpine` runtime image.

Backend production and test compilation and the full test suite passed on Temurin JDK 25.0.5.8. The Maven compiler target remains Java 21.

## Frontend Build

The frontend is a Next.js application.

**Verified Build Steps (from `woodyz-frontend/Dockerfile`):**

1. Uses `node:20-alpine` as the base image.
2. Runs `npm ci` to install the exact dependency tree from `package-lock.json`.
3. Sets `NEXT_PUBLIC_API_URL` as a build argument.
4. Runs `npm run build` to generate the Next.js production build.

The GitHub Actions frontend image build passes `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, and the optional `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` as Docker build arguments. A validation step fails before publishing if either URL is missing or not HTTPS; if a Stripe key is provided, it must be a live `pk_live_` key. Without a Stripe publishable key, checkout is disabled and the frontend does not request a PaymentIntent. The Dockerfile installs with `npm ci` and copies only app source/configuration paths, excluding host `node_modules`, `.next`, and `.git` from image contents.

For the recommended Railway path, create separate GitHub-backed services with root directories `/backend` and `/woodyz-frontend`; Railway detects each existing Dockerfile. Add the three `NEXT_PUBLIC_*` values to the frontend service so the Docker build receives them. They are public, build-time configuration, not secrets. Railway's direct repository build is separate from the existing GitHub Actions workflow and must not deploy a commit before its CI checks pass. [Railway Dockerfile build variables](https://docs.railway.com/builds/dockerfiles) [Railway frontend variables](https://docs.railway.com/guides/frontend-environment-variables)

Manufacturing quote verification: `npm run test:manufacturing-quote` passed 5 tests on 2026-10-21. `npm exec next build -- --webpack` passed and included `/manufacturing` and `/admin/manufacturing-quotes`. The build initially reported a multiple-lockfile root warning; after removing an empty, unused parent lockfile, the rerun passed without that warning. A prior default Turbopack build failed internally, so webpack is the verified path for this change.

Next.js is pinned to 16.4.2 following the audit of the former 16.2.4 pin. `npm audit --omit=dev` now reports zero production vulnerabilities. The full audit still reports 7 development-tool advisories tied to Tailwind CSS 3; the automatic remediation requires a Tailwind CSS 4 major migration and was not applied here.

`npm ci --dry-run --ignore-scripts --offline` passed on 2026-10-22 against the updated lockfile. On 2026-10-22, both the frontend image (`woodyz-frontend:launch-check`) and backend image (`woodyz-backend:launch-check`) built successfully in Docker. The frontend used validation-only build values; neither image was pushed or deployed.

## CI/CD Build Process

There is a GitHub Actions workflow (`.github/workflows/deploy.yml`) triggered on pushes to `master` and `main`.

**CI Steps:**

1. Checks out code and configures Temurin Java 25 with Maven caching.
2. Runs `mvn -B -f backend/pom.xml verify`, the Python manual-QA safety unit tests, and the frontend `npm run test:manufacturing-quote` suite before publishing.
3. Builds and pushes both backend and frontend images to Docker Hub.
4. Tags each image with `latest` and the exact Git commit SHA. Configure the frontend public API URL for the target environment before relying on a published image; the Dockerfile default is local development.

**Gaps & Unknowns:**

- `mvn -B -f backend/pom.xml verify` passed on 2026-10-22 with 26 tests and packaged the Spring Boot JAR. Production database, abuse, inventory, fulfillment, and browser coverage remain gaps.
- The backend Dockerfile still skips tests because CI runs Maven verification separately.
- The workflow publishes images but does not deploy them. Railway Pro is recommended, but its account, services, variables, DNS/TLS, and deployment gate are not yet configured.

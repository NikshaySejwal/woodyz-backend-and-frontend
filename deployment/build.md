# Build Process

## Prerequisites

- Docker and Docker Compose (for local building and running)
- Java 21 / Maven (for local backend development without Docker)
- Node.js 20 / npm (for local frontend development without Docker)

## Backend Build

The backend uses Maven for dependency management and building.

**Verified Build Steps (from `backend/Dockerfile`):**

1. Uses `maven:3.9-eclipse-temurin-21` as the build environment, matching `pom.xml`.
2. Copies `pom.xml` and `src/`.
3. Runs `mvn clean package -DskipTests` to build the JAR file.
4. The final artifact (`target/*.jar`) is copied into a lightweight `eclipse-temurin:21-jre-alpine` runtime image.

## Frontend Build

The frontend is a Next.js application.

**Verified Build Steps (from `woodyz-frontend/Dockerfile`):**

1. Uses `node:20-alpine` as the base image.
2. Runs `npm install` to install dependencies from `package.json`.
3. Sets `NEXT_PUBLIC_API_URL` as a build argument.
4. Runs `npm run build` to generate the Next.js production build.

## CI/CD Build Process

There is a GitHub Actions workflow (`.github/workflows/deploy.yml`) triggered on pushes to `master` and `main`.

**CI Steps:**

1. Checks out code and configures Temurin Java 21 with Maven caching.
2. Runs `mvn -B -f backend/pom.xml verify` before publishing.
3. Builds and pushes both backend and frontend images to Docker Hub.
4. Tags each image with `latest` and the exact Git commit SHA. Configure the frontend public API URL for the target environment before relying on a published image; the Dockerfile default is local development.

**Gaps & Unknowns:**

- Maven `verify` runs thirteen backend unit tests before image publishing, covering checkout invariants, request idempotency, and Stripe webhook signature/event deduplication. Broader auth, inventory, fulfillment, and API integration coverage is still needed.
- The backend Dockerfile still skips tests because CI runs Maven verification separately.
- The workflow publishes images but does not deploy them; the production host, TLS termination, and deployment credentials/automation remain unconfigured here.

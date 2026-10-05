# Build Process

## Prerequisites
- Docker and Docker Compose (for local building and running)
- Java 17 / Maven (for local backend development without Docker)
- Node.js 20 / npm (for local frontend development without Docker)

## Backend Build
The backend uses Maven for dependency management and building.

**Verified Build Steps (from `backend/Dockerfile`):**
1. Uses `maven:3.9-eclipse-temurin-17` as the build environment.
2. Copies `pom.xml` and `src/`.
3. Runs `mvn clean package -DskipTests` to build the JAR file.
4. The final artifact (`target/*.jar`) is copied into a lightweight `eclipse-temurin:17-jre-alpine` runtime image.

## Frontend Build
The frontend is a Next.js application.

**Verified Build Steps (from `woodyz-frontend/Dockerfile`):**
1. Uses `node:20-alpine` as the base image.
2. Runs `npm install` to install dependencies from `package.json`.
3. Sets `NEXT_PUBLIC_API_URL` as a build argument.
4. Runs `npm run build` to generate the Next.js production build.

## CI/CD Build Process
There is a GitHub Actions workflow (`.github/workflows/deploy.yml`) triggered on pushes to `master` and `main`.

**Verified CI Steps:**
1. Checks out code.
2. Sets up Docker Buildx.
3. Logs into Docker Hub using secrets (`DOCKER_USERNAME`, `DOCKER_PASSWORD`).
4. Builds the **Frontend** Docker image and pushes it to Docker Hub as `<DOCKER_USERNAME>/woodyz-frontend:latest`.

**Gaps & Unknowns:**
- The CI pipeline **only builds and pushes the frontend image**. The backend image is not built or pushed by GitHub Actions.
- Testing is skipped during the backend Docker build (`-DskipTests`), and there are no test steps in the CI pipeline.

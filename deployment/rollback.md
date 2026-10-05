# Rollback Process

## Current Rollback Capability
Based on the current infrastructure and CI/CD setup, automated rollbacks are **NOT SUPPORTED**.

### Container Images
- The GitHub Actions pipeline pushes the frontend image with the `latest` tag (`woodyz-frontend:latest`).
- Because unique version tags (e.g., git commit SHAs or semantic versioning) are not being published, rolling back to a previous specific frontend image from the registry is not possible without rebuilding it.
- The backend has no CI pipeline publishing images, meaning rollbacks would require manually checking out an older git commit on the server and rebuilding the backend image via Docker Compose.

### Database Migrations
- The application uses `SPRING_JPA_HIBERNATE_DDL_AUTO: update`.
- There is no formal database migration tool (like Flyway or Liquibase) detected in the `pom.xml`.
- **Warning**: Because Hibernate auto-update only adds columns/tables and does not safely handle dropping or renaming, rolling back the backend application version can lead to severe application crashes if the older code cannot handle the newer database schema. 

## Deployment Failure Recovery
If a deployment fails, the current recovery process would manually entail:
1. Reverting the Git commit.
2. Redeploying / rebuilding via `docker-compose up --build -d`.
3. Manually fixing any database schema inconsistencies caused by the Hibernate auto-update if the data model changed.

## Missing Capabilities (NEEDS CONFIRMATION/IMPLEMENTATION)
- Docker image version tagging in CI/CD.
- Database migration management (Flyway/Liquibase) to allow safe schema rollbacks.
- Blue/Green or Canary deployment strategies.

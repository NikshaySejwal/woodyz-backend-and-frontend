# Rollback Process

## Current Rollback Capability

Based on the current infrastructure and CI/CD setup, automated rollbacks are **NOT SUPPORTED**.

### Container Images

- GitHub Actions publishes backend and frontend images tagged both `latest` and with the full commit SHA (`<DOCKER_USERNAME>/woodyz-backend:<sha>` and `<DOCKER_USERNAME>/woodyz-frontend:<sha>`).
- A previous application version can be selected by pulling both images for the same known-good commit SHA. Do not use `latest` for a rollback.
- The current Compose file still builds from source and does not select registry image tags. The operator must configure the deployment to use the selected image references before this is a one-command rollback.

### Database Migrations

- The application uses `SPRING_JPA_HIBERNATE_DDL_AUTO: update`.
- The `orders.payment_intent_id` uniqueness constraint must be checked against existing data before deployment. Hibernate schema updates are not a substitute for a reviewed data migration.
- The `stripe_webhook_events` table is added for delivery deduplication; webhook rows are audit records and are not part of order fulfillment state.
- There is no formal database migration tool (like Flyway or Liquibase) detected in the `pom.xml`.
- **Warning**: Because Hibernate auto-update only adds columns/tables and does not safely handle dropping or renaming, rolling back the backend application version can lead to severe application crashes if the older code cannot handle the newer database schema.

## Deployment Failure Recovery

If a deployment fails, the current recovery process would manually entail:

1. Reverting the Git commit.
2. Redeploying / rebuilding via `docker-compose up --build -d`.
3. Manually fixing any database schema inconsistencies caused by the Hibernate auto-update if the data model changed.

## Missing Capabilities (NEEDS CONFIRMATION/IMPLEMENTATION)

- Compose-based image selection/deployment and automated rollback.
- Database migration management (Flyway/Liquibase) to allow safe schema rollbacks.
- Blue/Green or Canary deployment strategies.

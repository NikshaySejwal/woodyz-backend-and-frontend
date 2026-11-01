# Rollback Process

## Current Rollback Capability

Railway Pro is the recommended host, but it is not provisioned yet, so a rollback has not been rehearsed. Railway supports dashboard rollback to an earlier deployment while its image remains retained. On Pro, the documented image retention is 120 hours after a deployment is removed. Open the affected service's **Deployments** tab, select the last known-good deployment's menu, choose **Rollback**, and confirm. Railway restores that deployment's image and service variables. Repeat for both frontend and backend and verify that the versions are compatible. [Railway deployment actions](https://docs.railway.com/deployments/deployment-actions)

An application rollback does not reverse PostgreSQL schema updates or restore deleted/changed data. Use the tested database backup procedure separately when a schema or data recovery is needed. Do not assume a code rollback can undo `ddl-auto=update`.

The existing Compose-based manual procedure remains available for a self-managed host:

### Container Images

- GitHub Actions publishes backend and frontend images tagged both `latest` and with the full commit SHA (`<DOCKER_USERNAME>/woodyz-backend:<sha>` and `<DOCKER_USERNAME>/woodyz-frontend:<sha>`).
- A previous application version can be selected by pulling both images for the same known-good commit SHA. Do not use `latest` for a rollback.
- Compose accepts `BACKEND_IMAGE` and `FRONTEND_IMAGE`. For a manual app rollback, set both in `.env.production` to known-good commit SHA tags, run `docker compose --env-file .env.production pull backend frontend`, then `docker compose --env-file .env.production up -d --no-build`. Keep the image references paired to the same commit; do not use `latest`.

### Database Migrations

- The application uses `SPRING_JPA_HIBERNATE_DDL_AUTO: update`.
- The Manufacturing quote MVP adds `manufacturing_quote_requests`. Hibernate may create/update this table on startup. Back up and verify the database before rollout; application rollback will not necessarily reverse the schema change or remove captured contact data.
- The Compose upload bind mount is `./data/uploads:/app/data/uploads`. Include that directory in the backup/restore runbook and keep it consistent with the database restore point when uploaded product media is used.
- The `orders.payment_intent_id` uniqueness constraint must be checked against existing data before deployment. Hibernate schema updates are not a substitute for a reviewed data migration.
- The `stripe_webhook_events` table is added for delivery deduplication; webhook rows are audit records and are not part of order fulfillment state.
- There is no formal database migration tool (like Flyway or Liquibase) detected in the `pom.xml`.
- **Warning**: Because Hibernate auto-update only adds columns/tables and does not safely handle dropping or renaming, rolling back the backend application version can lead to severe application crashes if the older code cannot handle the newer database schema.

## Deployment Failure Recovery

If a self-managed Compose deployment fails, recovery would manually entail:

1. Reverting the Git commit.
2. Set both image variables in `.env.production` to the previous known-good commit SHA, then run `docker compose --env-file .env.production pull backend frontend` and `docker compose --env-file .env.production up -d --no-build`.
3. Manually fixing any database schema inconsistencies caused by the Hibernate auto-update if the data model changed.

## Missing Capabilities (NEEDS CONFIRMATION/IMPLEMENTATION)

- Railway rollback remains untested until a staging deployment is available; the existing image workflow does not deploy automatically.
- Database migration management (Flyway/Liquibase) to allow safe schema rollbacks.
- Blue/Green or Canary deployment strategies.

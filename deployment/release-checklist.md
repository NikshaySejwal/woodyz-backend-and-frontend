# Pre-Release Checklist

This checklist is tailored to the current state of the project, highlighting areas that need verification before a release.

## 1. Code & Build Validation

- [ ] Backend builds successfully locally (`mvn clean package`).
- [ ] Frontend builds successfully locally (`npm run build`).
- [ ] GitHub Actions backend Maven verification and frontend/backend image publishing pass.
- [ ] Expand backend behavioral and integration tests beyond the thirteen current backend unit tests.

## 2. Environment & Secrets

- [ ] All required secrets are available in the target environment:
  - `POSTGRES_PASSWORD`
  - `APP_JWT_SECRET`
  - `STRIPE_API_KEY`
  - `STRIPE_WEBHOOK_SECRET` (required if webhook delivery is enabled)
  - `SENDGRID_API_KEY`
- [ ] Frontend environment variables (e.g., `NEXT_PUBLIC_API_URL`) are correctly pointing to the production domain.

## 3. Database & Migrations

- [ ] **CRITICAL:** Review Entity changes. Since `SPRING_JPA_HIBERNATE_DDL_AUTO: update` is used, ensure that new code will not corrupt or conflict with existing production data.
- [ ] Before deploying the PaymentIntent uniqueness constraint, confirm there are no duplicate non-null `orders.payment_intent_id` values in the database.
- [ ] Take a manual backup of the PostgreSQL database before deploying.

## 4. API & Compatibility

- [ ] Ensure frontend changes are compatible with the backend API version being deployed.
- [ ] Verify frontend Docker build has the correct `NEXT_PUBLIC_API_URL` injected at build time.

## 5. Deployment Execution

- [ ] Verify GitHub Action has pushed backend and frontend images tagged with the target commit SHA.
- [ ] Pull latest changes on the deployment server.
- [ ] Run deployment command (`docker-compose up --build -d`).

## 6. Post-Deployment & Health Checks

- [ ] Verify Frontend is accessible and loading correctly.
- [ ] Verify Backend API is responding (check login/authentication flow).
- [ ] Verify Database connection (check logs for Hibernate errors).
- [ ] Verify 3rd party integrations (Stripe, Sendgrid).
- [ ] When webhooks are enabled, configure the Stripe endpoint secret and verify signed delivery reaches `POST /api/payments/webhook`.
- [ ] Check Docker logs for any crash loops (`docker-compose logs -f`).

## 7. Rollback Readiness

- [ ] Record the previous working commit SHA and confirm matching backend/frontend images are available.
- [ ] Confirm the deployment is configured to pull the selected image tags; Compose currently builds from source.
- [ ] Confirm database backup is accessible for restoration if schema corruption occurs.

# WOODYZ File Dependency Map

## Request Flows

### Authentication

```text
pages/auth/login.js
  -> lib/api.js
  -> POST /api/auth/login
  -> AuthController
  -> AuthenticationManager/UserDetailsServiceImpl
  -> UserRepository
  -> JwtTokenProvider
  -> JWT response
  -> AuthContext localStorage
```

### Product browsing

```text
pages/products.js or pages/products/[id].js
  -> lib/api.js
  -> ProductController
  -> ProductService
  -> ProductRepository
  -> Product entity
  -> JSON response
  -> product UI and SEO JSON-LD
```

### Product administration

```text
admin product UI
  -> lib/api.js bearer token
  -> ProductController POST/PUT/DELETE
  -> SecurityConfig ROLE_ADMIN rule
  -> ProductService
  -> ProductRepository
```

### Checkout and payment

```text
pages/checkout.js
  -> sessionStorage UUID keyed by authenticated user and cart fingerprint
  -> POST /api/payments/create-payment-intent with product IDs, quantities, and Idempotency-Key
  -> PaymentController
  -> ProductRepository server-side price calculation
  -> StripeService + Stripe RequestOptions idempotency key
  -> Stripe client secret
  -> CheckoutForm Stripe confirmation
  -> POST /api/orders/ with payment intent ID and cart items
  -> OrderController
  -> OrderService
  -> StripeService payment verification
  -> OrderRepository + OrderStatusHistoryRepository
  -> EmailService
```

Order retries with the same PaymentIntent return the existing order for the same user; database uniqueness prevents duplicate PaymentIntent orders. The public `POST /api/payments/webhook` verifies `Stripe-Signature` using `STRIPE_WEBHOOK_SECRET` and stores unique event IDs in `stripe_webhook_events`. It currently acknowledges/deduplicates events only and does not reconcile payment state, create orders, or trigger fulfillment. Configure a Stripe endpoint to the public HTTPS backend URL ending in `/api/payments/webhook` and provide its signing secret to the backend.

### Order history

```text
pages/orders.js
  -> lib/api.js
  -> GET /api/user/profile
  -> GET /api/orders/user/{id}
  -> OrderController
  -> OrderService
  -> OrderRepository
```

Customer order reads are now authenticated and ownership-scoped; admin access is handled by role checks.

### Reviews and support

```text
ProductReviews/SupportBubble
  -> lib/api.js
  -> ReviewController or SupportTicketController
  -> ReviewService or SupportTicketService
  -> repository
```

Known risk: anonymous submission routes exist and require validation, rate limiting, moderation, and ownership review.

## Cross-Cutting Dependencies

- `_app.js` composes global providers/layout and is a high-impact frontend file.
- `AuthContext.js` and `lib/api.js` affect every authenticated frontend request.
- `SecurityConfig.java` affects every backend endpoint.
- `application.properties` affects database, JWT, Redis, Stripe, and SendGrid startup behavior.
- `docker-compose.yml` controls local service wiring and deployment assumptions.

## Modification Risk

- HIGH: `SecurityConfig.java`, `OrderController.java`, `OrderService.java`, `PaymentController.java`, `AuthContext.js`, `lib/api.js`, `docker-compose.yml`.
- MEDIUM: `ProductController.java`, `ProductService.java`, shared `Seo.js`, `_app.js`, checkout components.
- LOW: isolated static/legal pages and presentation-only components, subject to route and branding checks.

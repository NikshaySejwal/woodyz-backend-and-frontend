package com.example.woodyzbackend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.woodyzbackend.entity.Product;
import com.example.woodyzbackend.repository.ProductRepository;
import com.example.woodyzbackend.service.StripeService;
import com.example.woodyzbackend.service.StripeWebhookService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;

/**
 * REST controller for handling payment-related operations. Primarily manages
 * the creation of Stripe payment intents.
 *
 * Connections: - Integrates with `StripeService` to interact with the Stripe
 * API. - Uses `ProductRepository` to perform server-side price calculation,
 * ensuring clients cannot manipulate amounts. - Exposed via `/api/payments/**`
 * (requires authentication).
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private StripeService stripeService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StripeWebhookService stripeWebhookService;

    /**
     * Creates a Stripe Payment Intent based on a list of products and
     * quantities. The total amount is calculated on the server side using
     * product prices from the database.
     *
     * @param data A map containing a list of items, where each item has
     * `productId` and `quantity`.
     * @return A `ResponseEntity` containing the `clientSecret` for the Stripe
     * frontend integration.
     */
    @PostMapping("/create-payment-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody Map<String, Object> data,
            @RequestHeader("Idempotency-Key") String requestKey, Authentication authentication) {
        UUID parsedRequestKey;
        try {
            parsedRequestKey = UUID.fromString(requestKey);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body("Idempotency-Key must be a UUID");
        }
        if (!parsedRequestKey.toString().equalsIgnoreCase(requestKey)) {
            return ResponseEntity.badRequest().body("Idempotency-Key must be a UUID");
        }

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawItems = (List<Map<String, Object>>) data.get("items");
            if (rawItems == null || rawItems.isEmpty()) {
                return ResponseEntity.badRequest().body("Items list cannot be empty");
            }
            double amount = 0;
            for (Map<String, Object> rawItem : rawItems) {
                Object pObj = rawItem.get("productId");
                Object qObj = rawItem.get("quantity");
                if (pObj == null || qObj == null) {
                    return ResponseEntity.badRequest().body("productId and quantity are required");
                }
                Long productId = ((Number) pObj).longValue();
                int quantity = ((Number) qObj).intValue();
                if (quantity < 1 || quantity > 100) {
                    return ResponseEntity.badRequest().body("Quantity out of bounds");
                }
                Product product = productRepository.findById(productId).orElse(null);
                if (product == null) {
                    return ResponseEntity.badRequest().body("Product not found: " + productId);
                }
                amount += product.getPrice() * quantity;
            }
            String currency = "usd";

            String stripeIdempotencyKey = authentication.getName() + ":" + parsedRequestKey;
            String clientSecret = stripeService.createPaymentIntent(amount, currency, stripeIdempotencyKey);

            Map<String, Object> response = new HashMap<>();
            response.put("clientSecret", clientSecret);
            response.put("amount", amount);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Unable to create payment intent: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {
        Event event;
        try {
            event = stripeService.verifyWebhookEvent(payload, signature);
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(503).body(Map.of("error", "Stripe webhook is not configured"));
        } catch (SignatureVerificationException | RuntimeException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid Stripe webhook"));
        }

        boolean recorded = stripeWebhookService.recordEvent(event);
        return ResponseEntity.ok(Map.of("received", true, "duplicate", !recorded));
    }
}

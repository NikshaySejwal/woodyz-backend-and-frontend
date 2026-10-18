package com.example.woodyzbackend.controller;

import com.example.woodyzbackend.service.StripeService;
import com.example.woodyzbackend.entity.Product;
import com.example.woodyzbackend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

/**
 * REST controller for handling payment-related operations.
 * Primarily manages the creation of Stripe payment intents.
 * 
 * Connections:
 * - Integrates with `StripeService` to interact with the Stripe API.
 * - Uses `ProductRepository` to perform server-side price calculation, ensuring clients cannot manipulate amounts.
 * - Exposed via `/api/payments/**` (requires authentication).
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private StripeService stripeService;

    @Autowired
    private ProductRepository productRepository;

    /**
     * Creates a Stripe Payment Intent based on a list of products and quantities.
     * The total amount is calculated on the server side using product prices from the database.
     * 
     * @param data A map containing a list of items, where each item has `productId` and `quantity`.
     * @return A `ResponseEntity` containing the `clientSecret` for the Stripe frontend integration.
     */
    @PostMapping("/create-payment-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody Map<String, Object> data) {
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
            
            String clientSecret = stripeService.createPaymentIntent(amount, currency);
            
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
}

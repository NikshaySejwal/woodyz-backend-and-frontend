package com.example.woodyzbackend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.woodyzbackend.dto.CheckoutItemRequest;
import com.example.woodyzbackend.dto.DemoPaymentIntentRequest;
import com.example.woodyzbackend.entity.Product;
import com.example.woodyzbackend.repository.ProductRepository;
import com.example.woodyzbackend.service.DemoPaymentService;

@RestController
@Profile("local-demo")
@RequestMapping("/api/payments")
public class DemoPaymentController {

    private final ProductRepository productRepository;
    private final DemoPaymentService demoPaymentService;

    public DemoPaymentController(ProductRepository productRepository, DemoPaymentService demoPaymentService) {
        this.productRepository = productRepository;
        this.demoPaymentService = demoPaymentService;
    }

    @PostMapping("/demo-intent")
    public ResponseEntity<?> createDemoIntent(@RequestBody DemoPaymentIntentRequest request,
            Authentication authentication) {
        List<CheckoutItemRequest> items = request == null ? null : request.getItems();
        if (items == null || items.isEmpty() || request.getMethod() == null
                || !DemoPaymentService.supportedMethods().containsValue(request.getMethod())) {
            return ResponseEntity.badRequest().body("Valid items and demo payment method are required");
        }

        try {
            double amount = 0;
            for (CheckoutItemRequest item : items) {
                if (item == null || item.getProductId() == null || item.getQuantity() == null
                        || item.getQuantity() < 1 || item.getQuantity() > 100) {
                    return ResponseEntity.badRequest().body("Invalid cart item");
                }
                Product product = productRepository.findById(item.getProductId()).orElse(null);
                if (product == null) {
                    return ResponseEntity.badRequest().body("Product not found");
                }
                if (!Double.isFinite(product.getPrice()) || product.getPrice() <= 0) {
                    return ResponseEntity.badRequest().body("Product price is invalid");
                }
                amount += product.getPrice() * item.getQuantity();
            }

            String paymentId = demoPaymentService.createPayment(authentication.getName(), amount, request.getMethod());
            Map<String, Object> response = new HashMap<>();
            response.put("paymentIntentId", paymentId);
            response.put("amount", amount);
            response.put("method", request.getMethod());
            response.put("demo", true);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(exception.getMessage());
        }
    }
}

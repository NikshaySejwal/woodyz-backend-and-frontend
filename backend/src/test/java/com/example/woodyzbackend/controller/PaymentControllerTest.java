package com.example.woodyzbackend.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.woodyzbackend.entity.Product;
import com.example.woodyzbackend.repository.ProductRepository;
import com.example.woodyzbackend.service.StripeService;
import com.example.woodyzbackend.service.StripeWebhookService;

class PaymentControllerTest {

    @Test
    void createPaymentIntentScopesStripeIdempotencyKeyToAuthenticatedUser() throws Exception {
        PaymentController controller = new PaymentController();
        StripeService stripeService = mock(StripeService.class);
        ProductRepository productRepository = mock(ProductRepository.class);
        ReflectionTestUtils.setField(controller, "stripeService", stripeService);
        ReflectionTestUtils.setField(controller, "productRepository", productRepository);
        ReflectionTestUtils.setField(controller, "stripeWebhookService", mock(StripeWebhookService.class));
        ReflectionTestUtils.setField(controller, "commerceEnabled", true);

        when(stripeService.isConfigured()).thenReturn(true);
        Product product = new Product();
        product.setPrice(12.5);
        when(productRepository.findById(4L)).thenReturn(Optional.of(product));
        when(stripeService.createPaymentIntent(25.0, "inr", "customer:123e4567-e89b-12d3-a456-426614174000"))
                .thenReturn("pi_test_secret");
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("customer");

        ResponseEntity<?> response = controller.createPaymentIntent(
                Map.of("items", List.of(Map.of("productId", 4L, "quantity", 2))),
                "123e4567-e89b-12d3-a456-426614174000", authentication);

        assertEquals(200, response.getStatusCodeValue());
        verify(stripeService).createPaymentIntent(25.0, "inr",
                "customer:123e4567-e89b-12d3-a456-426614174000");
    }

    @Test
    void createPaymentIntentRejectsUnpublishedProducts() {
        PaymentController controller = new PaymentController();
        StripeService stripeService = mock(StripeService.class);
        ProductRepository productRepository = mock(ProductRepository.class);
        ReflectionTestUtils.setField(controller, "stripeService", stripeService);
        ReflectionTestUtils.setField(controller, "productRepository", productRepository);
        ReflectionTestUtils.setField(controller, "commerceEnabled", true);
        when(stripeService.isConfigured()).thenReturn(true);
        Product product = new Product();
        product.setPublished(Boolean.FALSE);
        when(productRepository.findById(4L)).thenReturn(Optional.of(product));

        ResponseEntity<?> response = controller.createPaymentIntent(
                Map.of("items", List.of(Map.of("productId", 4L, "quantity", 1))),
                "123e4567-e89b-12d3-a456-426614174000", mock(Authentication.class));

        assertEquals(400, response.getStatusCodeValue());
        assertEquals("Product is not available", response.getBody());
    }

    @Test
    void createPaymentIntentRejectsNonUuidIdempotencyKey() {
        PaymentController controller = new PaymentController();
        Authentication authentication = mock(Authentication.class);

        ResponseEntity<?> response = controller.createPaymentIntent(Map.of("items", List.of()), "not-a-uuid", authentication);

        assertEquals(400, response.getStatusCodeValue());
        assertEquals("Idempotency-Key must be a UUID", response.getBody());
    }

    @Test
    void createPaymentIntentIsUnavailableWhenCommerceIsDisabled() {
        PaymentController controller = new PaymentController();

        ResponseEntity<?> response = controller.createPaymentIntent(
                Map.of("items", List.of()), "123e4567-e89b-12d3-a456-426614174000", null);

        assertEquals(503, response.getStatusCodeValue());
        assertEquals(Map.of("error", "Online ordering is not enabled"), response.getBody());
    }

    @Test
    void createPaymentIntentReturnsUnavailableWhenStripeIsNotConfigured() {
        PaymentController controller = new PaymentController();
        StripeService stripeService = mock(StripeService.class);
        ReflectionTestUtils.setField(controller, "stripeService", stripeService);
        ReflectionTestUtils.setField(controller, "commerceEnabled", true);
        when(stripeService.isConfigured()).thenReturn(false);

        ResponseEntity<?> response = controller.createPaymentIntent(
                Map.of("items", List.of()), "123e4567-e89b-12d3-a456-426614174000", null);

        assertEquals(503, response.getStatusCodeValue());
        assertEquals(Map.of("error", "Card payments are temporarily unavailable"), response.getBody());
    }
}

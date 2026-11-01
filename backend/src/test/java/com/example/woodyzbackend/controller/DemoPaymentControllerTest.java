package com.example.woodyzbackend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import com.example.woodyzbackend.dto.CheckoutItemRequest;
import com.example.woodyzbackend.dto.DemoPaymentIntentRequest;
import com.example.woodyzbackend.entity.Product;
import com.example.woodyzbackend.repository.ProductRepository;
import com.example.woodyzbackend.service.DemoPaymentService;

class DemoPaymentControllerTest {

    @Test
    void createsIntentFromDatabasePricesForSelectedDemoMethod() {
        ProductRepository products = mock(ProductRepository.class);
        DemoPaymentService payments = mock(DemoPaymentService.class);
        DemoPaymentController controller = new DemoPaymentController(products, payments);
        Product product = new Product();
        product.setPrice(8.25);
        when(products.findById(7L)).thenReturn(Optional.of(product));
        when(payments.createPayment("customer", 16.50, DemoPaymentService.QR_METHOD)).thenReturn("demo_test");

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setProductId(7L);
        item.setQuantity(2);
        DemoPaymentIntentRequest request = new DemoPaymentIntentRequest();
        request.setItems(List.of(item));
        request.setMethod(DemoPaymentService.QR_METHOD);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("customer");

        ResponseEntity<?> response = controller.createDemoIntent(request, authentication);

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(16.50, ((Number) ((java.util.Map<?, ?>) response.getBody()).get("amount")).doubleValue(), 0.001);
        verify(payments).createPayment("customer", 16.50, DemoPaymentService.QR_METHOD);
    }

    @Test
    void rejectsInvalidQuantityBeforeCreatingAnIntent() {
        ProductRepository products = mock(ProductRepository.class);
        DemoPaymentService payments = mock(DemoPaymentService.class);
        DemoPaymentController controller = new DemoPaymentController(products, payments);
        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setProductId(7L);
        item.setQuantity(0);
        DemoPaymentIntentRequest request = new DemoPaymentIntentRequest();
        request.setItems(List.of(item));
        request.setMethod(DemoPaymentService.DELIVERY_METHOD);

        ResponseEntity<?> response = controller.createDemoIntent(request, mock(Authentication.class));

        assertEquals(400, response.getStatusCodeValue());
    }
}

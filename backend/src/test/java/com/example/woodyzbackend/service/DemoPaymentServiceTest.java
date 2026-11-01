package com.example.woodyzbackend.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class DemoPaymentServiceTest {

    @Test
    void demoPaymentIsBoundToUserAndAmountAndCanOnlyBeConsumedOnce() {
        DemoPaymentService service = new DemoPaymentService();
        String paymentId = service.createPayment("customer-a", 25.50, DemoPaymentService.QR_METHOD);

        assertTrue(paymentId.startsWith(DemoPaymentService.PAYMENT_ID_PREFIX));
        assertTrue(service.isPaid(paymentId, "customer-a", 25.50));
        assertFalse(service.isPaid(paymentId, "customer-b", 25.50));
        assertFalse(service.isPaid(paymentId, "customer-a", 25.51));
        assertTrue(service.consume(paymentId, "customer-a"));
        assertFalse(service.isPaid(paymentId, "customer-a", 25.50));
        assertFalse(service.consume(paymentId, "customer-a"));
    }
}

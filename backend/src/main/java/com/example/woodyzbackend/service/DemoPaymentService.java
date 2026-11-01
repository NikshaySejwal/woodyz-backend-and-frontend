package com.example.woodyzbackend.service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("local-demo")
public class DemoPaymentService {

    public static final String PAYMENT_ID_PREFIX = "demo_";
    public static final String QR_METHOD = "DEMO_QR";
    public static final String DELIVERY_METHOD = "DEMO_DELIVERY";

    private final ConcurrentMap<String, DemoPayment> payments = new ConcurrentHashMap<>();

    public String createPayment(String username, double amount, String method) {
        if (username == null || username.isBlank() || !Double.isFinite(amount) || amount <= 0
                || (!QR_METHOD.equals(method) && !DELIVERY_METHOD.equals(method))) {
            throw new IllegalArgumentException("Invalid demo payment");
        }
        String paymentId = PAYMENT_ID_PREFIX + UUID.randomUUID();
        payments.put(paymentId, new DemoPayment(username, Math.round(amount * 100), method));
        return paymentId;
    }

    public boolean isPaid(String paymentId, String username, double amount) {
        DemoPayment payment = payments.get(paymentId);
        return payment != null && payment.username.equals(username)
                && payment.amountInCents == Math.round(amount * 100);
    }

    public boolean consume(String paymentId, String username) {
        DemoPayment payment = payments.get(paymentId);
        return payment != null && payment.username.equals(username) && payments.remove(paymentId, payment);
    }

    public static Map<String, String> supportedMethods() {
        return Map.of("qr", QR_METHOD, "delivery", DELIVERY_METHOD);
    }

    private static final class DemoPayment {

        private final String username;
        private final long amountInCents;
        private final String method;

        private DemoPayment(String username, long amountInCents, String method) {
            this.username = username;
            this.amountInCents = amountInCents;
            this.method = method;
        }
    }
}

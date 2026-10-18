package com.example.woodyzbackend.service;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;

@Service
public class StripeService {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${stripe.webhook.secret:}")
    private String stripeWebhookSecret;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    public String createPaymentIntent(double amount, String currency, String idempotencyKey) throws Exception {
        if (stripeApiKey == null || stripeApiKey.startsWith("sk_test_mock")) {
            return "pi_mock_secret_" + idempotencyKey;
        }
        // Stripe expects amount in cents
        long amountInCents = (long) (amount * 100);

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency(currency)
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
                .build();

        RequestOptions requestOptions = RequestOptions.builder()
                .setIdempotencyKey(idempotencyKey)
                .build();
        PaymentIntent intent = PaymentIntent.create(params, requestOptions);
        return intent.getClientSecret();
    }

    public boolean isPaid(String paymentIntentId, double expectedAmount) throws Exception {
        PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
        long expectedCents = Math.round(expectedAmount * 100);
        return "succeeded".equals(intent.getStatus()) && intent.getAmount() == expectedCents;
    }

    public Event verifyWebhookEvent(String payload, String signature) throws SignatureVerificationException {
        if (stripeWebhookSecret == null || stripeWebhookSecret.trim().isEmpty()) {
            throw new IllegalStateException("Stripe webhook secret is not configured");
        }
        return Webhook.constructEvent(payload, signature, stripeWebhookSecret);
    }
}

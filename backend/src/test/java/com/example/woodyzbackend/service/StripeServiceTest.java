package com.example.woodyzbackend.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;

class StripeServiceTest {

    private static final String WEBHOOK_SECRET = "whsec_test_secret";
    private static final String PAYLOAD = "{\"id\":\"evt_test\",\"object\":\"event\",\"type\":\"payment_intent.succeeded\",\"data\":{\"object\":{\"id\":\"pi_test\",\"object\":\"payment_intent\"}}}";

    @Test
    void createMockPaymentIntentIsStableForSameIdempotencyKey() throws Exception {
        StripeService stripeService = new StripeService();
        ReflectionTestUtils.setField(stripeService, "stripeApiKey", "sk_test_mock_key");

        String initialIntent = stripeService.createPaymentIntent(25.0, "usd", "customer:key-1");
        String retryIntent = stripeService.createPaymentIntent(25.0, "usd", "customer:key-1");
        String distinctIntent = stripeService.createPaymentIntent(25.0, "usd", "customer:key-2");

        assertEquals(initialIntent, retryIntent);
        assertNotEquals(initialIntent, distinctIntent);
    }

    @Test
    void verifyWebhookEventAcceptsValidSignature() throws Exception {
        StripeService stripeService = new StripeService();
        ReflectionTestUtils.setField(stripeService, "stripeWebhookSecret", WEBHOOK_SECRET);
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String signature = createSignature(timestamp, PAYLOAD);

        Event event = stripeService.verifyWebhookEvent(PAYLOAD, signature);

        assertEquals("evt_test", event.getId());
        assertEquals("payment_intent.succeeded", event.getType());
    }

    @Test
    void verifyWebhookEventRejectsInvalidSignature() {
        StripeService stripeService = new StripeService();
        ReflectionTestUtils.setField(stripeService, "stripeWebhookSecret", WEBHOOK_SECRET);

        SignatureVerificationException exception = assertThrows(SignatureVerificationException.class,
                () -> stripeService.verifyWebhookEvent(PAYLOAD, "t=1,v1=invalid"));
        assertEquals("t=1,v1=invalid", exception.getSigHeader());
    }

    @Test
    void verifyWebhookEventFailsClosedWithoutConfiguredSecret() {
        StripeService stripeService = new StripeService();

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> stripeService.verifyWebhookEvent(PAYLOAD, "t=1,v1=invalid"));
        assertEquals("Stripe webhook secret is not configured", exception.getMessage());
    }

    private String createSignature(String timestamp, String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(WEBHOOK_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] digest = mac.doFinal((timestamp + "." + payload).getBytes(StandardCharsets.UTF_8));
        return "t=" + timestamp + ",v1=" + HexFormat.of().formatHex(digest);
    }
}

package com.example.woodyzbackend.entity;

import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "stripe_webhook_events")
public class StripeWebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stripe_event_id", nullable = false, unique = true)
    private String stripeEventId;

    @Column(nullable = false)
    private String eventType;

    private String paymentIntentId;

    @Column(nullable = false)
    @SuppressWarnings("FieldMayBeFinal")
    private LocalDateTime receivedAt;

    public StripeWebhookEvent() {
        this.receivedAt = LocalDateTime.now();
    }

    public StripeWebhookEvent(String stripeEventId, String eventType, String paymentIntentId) {
        this.stripeEventId = stripeEventId;
        this.eventType = eventType;
        this.paymentIntentId = paymentIntentId;
        this.receivedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getStripeEventId() {
        return stripeEventId;
    }

    public String getEventType() {
        return eventType;
    }

    public String getPaymentIntentId() {
        return paymentIntentId;
    }

    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }
}

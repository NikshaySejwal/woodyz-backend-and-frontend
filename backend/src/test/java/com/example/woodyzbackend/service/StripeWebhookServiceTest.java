package com.example.woodyzbackend.service;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.woodyzbackend.entity.StripeWebhookEvent;
import com.example.woodyzbackend.repository.StripeWebhookEventRepository;
import com.stripe.model.Charge;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;

class StripeWebhookServiceTest {

    private StripeWebhookService webhookService;
    private StripeWebhookEventRepository eventRepository;

    void setUp() {
        webhookService = new StripeWebhookService();
        eventRepository = mock(StripeWebhookEventRepository.class);
        ReflectionTestUtils.setField(webhookService, "eventRepository", eventRepository);
    }

    @Test
    void recordEventStoresPaymentIntentIdOnce() {
        setUp();
        Event event = mock(Event.class);
        EventDataObjectDeserializer deserializer = mock(EventDataObjectDeserializer.class);
        PaymentIntent paymentIntent = mock(PaymentIntent.class);
        when(event.getId()).thenReturn("evt_123");
        when(event.getType()).thenReturn("payment_intent.succeeded");
        when(event.getDataObjectDeserializer()).thenReturn(deserializer);
        when(deserializer.getObject()).thenReturn(Optional.of(paymentIntent));
        when(paymentIntent.getId()).thenReturn("pi_123");
        when(eventRepository.existsByStripeEventId("evt_123")).thenReturn(false);

        assertTrue(webhookService.recordEvent(event));

        org.mockito.ArgumentCaptor<StripeWebhookEvent> eventCaptor
                = org.mockito.ArgumentCaptor.forClass(StripeWebhookEvent.class);
        verify(eventRepository).save(eventCaptor.capture());
        assertEquals("evt_123", eventCaptor.getValue().getStripeEventId());
        assertEquals("payment_intent.succeeded", eventCaptor.getValue().getEventType());
        assertEquals("pi_123", eventCaptor.getValue().getPaymentIntentId());
    }

    @Test
    void recordEventSkipsPreviouslyRecordedStripeEvent() {
        setUp();
        Event event = mock(Event.class);
        when(event.getId()).thenReturn("evt_duplicate");
        when(eventRepository.existsByStripeEventId("evt_duplicate")).thenReturn(true);

        assertFalse(webhookService.recordEvent(event));

        verify(eventRepository, never()).save(any(StripeWebhookEvent.class));
    }

    @Test
    void recordEventDoesNotTreatChargeIdAsPaymentIntentId() {
        setUp();
        Event event = mock(Event.class);
        EventDataObjectDeserializer deserializer = mock(EventDataObjectDeserializer.class);
        Charge charge = mock(Charge.class);
        when(event.getId()).thenReturn("evt_charge");
        when(event.getType()).thenReturn("charge.succeeded");
        when(event.getDataObjectDeserializer()).thenReturn(deserializer);
        when(deserializer.getObject()).thenReturn(Optional.of(charge));
        when(eventRepository.existsByStripeEventId("evt_charge")).thenReturn(false);

        assertTrue(webhookService.recordEvent(event));

        org.mockito.ArgumentCaptor<StripeWebhookEvent> eventCaptor
                = org.mockito.ArgumentCaptor.forClass(StripeWebhookEvent.class);
        verify(eventRepository).save(eventCaptor.capture());
        assertEquals(null, eventCaptor.getValue().getPaymentIntentId());
    }
}

package com.example.woodyzbackend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.woodyzbackend.entity.StripeWebhookEvent;
import com.example.woodyzbackend.repository.StripeWebhookEventRepository;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;

@Service
public class StripeWebhookService {

    @Autowired
    private StripeWebhookEventRepository eventRepository;

    @Transactional
    public boolean recordEvent(Event event) {
        if (eventRepository.existsByStripeEventId(event.getId())) {
            return false;
        }

        String paymentIntentId = event.getDataObjectDeserializer().getObject()
                .filter(PaymentIntent.class::isInstance)
                .map(PaymentIntent.class::cast)
                .map(PaymentIntent::getId)
                .orElse(null);

        eventRepository.save(new StripeWebhookEvent(event.getId(), event.getType(), paymentIntentId));
        return true;
    }
}

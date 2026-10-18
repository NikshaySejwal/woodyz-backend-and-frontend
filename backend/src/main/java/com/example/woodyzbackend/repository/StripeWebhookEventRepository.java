package com.example.woodyzbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.woodyzbackend.entity.StripeWebhookEvent;

@Repository
public interface StripeWebhookEventRepository extends JpaRepository<StripeWebhookEvent, Long> {

    boolean existsByStripeEventId(String stripeEventId);
}

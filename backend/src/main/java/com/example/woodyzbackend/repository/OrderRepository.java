package com.example.woodyzbackend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.woodyzbackend.entity.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Iterable<Order> findByUserId(Long userId);

    Optional<Order> findByPaymentIntentId(String paymentIntentId);
}

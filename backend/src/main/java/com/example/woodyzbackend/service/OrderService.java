package com.example.woodyzbackend.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.woodyzbackend.dto.CheckoutItemRequest;
import com.example.woodyzbackend.entity.Order;
import com.example.woodyzbackend.entity.OrderStatusHistory;
import com.example.woodyzbackend.entity.Product;
import com.example.woodyzbackend.entity.User;
import com.example.woodyzbackend.repository.OrderRepository;
import com.example.woodyzbackend.repository.OrderStatusHistoryRepository;
import com.example.woodyzbackend.repository.ProductRepository;
import com.example.woodyzbackend.repository.UserRepository;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StripeService stripeService;

    public Iterable<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Iterable<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    public Iterable<Order> getOrdersForCurrentUser() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username);
        return currentUser == null ? java.util.Collections.emptyList() : orderRepository.findByUserId(currentUser.getId());
    }

    @SuppressWarnings("null")
    public Order getOrderById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    public List<OrderStatusHistory> getOrderHistory(Long orderId) {
        return orderStatusHistoryRepository.findByOrderIdOrderByUpdatedAtAsc(orderId);
    }

    public boolean canAccessOrder(Order order, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        if (authentication.getAuthorities().stream().anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()))) {
            return true;
        }
        User currentUser = userRepository.findByUsername(authentication.getName());
        return order.getUserId() != null && currentUser != null && order.getUserId().equals(currentUser.getId());
    }

    public Order saveCustomerOrder(Order order, Authentication authentication) {
        User currentUser = userRepository.findByUsername(authentication.getName());
        if (currentUser == null) {
            throw new IllegalStateException("Authenticated user was not found");
        }
        order.setId(null);
        order.setUserId(currentUser.getId());
        order.setCustomerEmail(currentUser.getEmail());
        order.setDeliveryAddress(currentUser.getAddress());
        if (order.getPaymentIntentId() == null || order.getItems() == null || order.getItems().isEmpty()) {
            throw new IllegalArgumentException("A verified payment and cart items are required");
        }
        double calculatedTotal = calculateTotal(order.getItems());
        Order existingOrder = orderRepository.findByPaymentIntentId(order.getPaymentIntentId()).orElse(null);
        if (existingOrder != null) {
            if (!currentUser.getId().equals(existingOrder.getUserId())) {
                throw new IllegalArgumentException("Payment intent has already been used");
            }
            if (Math.round(existingOrder.getTotalAmount() * 100) != Math.round(calculatedTotal * 100)) {
                throw new IllegalArgumentException("Payment intent amount does not match the order");
            }
            return existingOrder;
        }
        try {
            if (!stripeService.isPaid(order.getPaymentIntentId(), calculatedTotal)) {
                throw new IllegalArgumentException("Payment has not been verified");
            }
        } catch (Exception exception) {
            throw new IllegalArgumentException("Payment verification failed", exception);
        }
        order.setTotalAmount(calculatedTotal);
        order.setStatus("Pending");
        return saveOrder(order);
    }

    public Order updateStatus(Long orderId, String status, LocalDate estimatedDeliveryDate,
            String expectedDeliveryTime, Authentication authentication) {
        Order order = getOrderById(orderId);
        if (order == null || !canAccessOrder(order, authentication)) {
            return null;
        }
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        if (!admin && !("CANCELLED".equalsIgnoreCase(status) && "Pending".equalsIgnoreCase(order.getStatus()))) {
            throw new IllegalStateException("Customers can only cancel pending orders");
        }
        order.setStatus(status);
        if (estimatedDeliveryDate != null) {
            order.setEstimatedDeliveryDate(estimatedDeliveryDate);
        }
        if (expectedDeliveryTime != null) {
            order.setExpectedDeliveryTime(expectedDeliveryTime);
        }
        return saveOrder(order);
    }

    private double calculateTotal(List<CheckoutItemRequest> items) {
        double total = 0;
        for (CheckoutItemRequest item : items) {
            if (item.getProductId() == null || item.getQuantity() == null || item.getQuantity() < 1 || item.getQuantity() > 100) {
                throw new IllegalArgumentException("Invalid cart item");
            }
            Long productId = java.util.Objects.requireNonNull(item.getProductId(), "productId must not be null");
            Product product = productRepository.findById(productId).orElseThrow(
                    () -> new IllegalArgumentException("Product not found"));
            total += product.getPrice() * item.getQuantity();
        }
        return total;
    }

    @SuppressWarnings("null")
    public Order saveOrder(Order order) {
        boolean isNew = order.getId() == null;
        Order savedOrder = orderRepository.save(order);

        // Record History
        String historyMessage = isNew ? "Order placed successfully!" : "Order status updated to " + order.getStatus();
        orderStatusHistoryRepository.save(new OrderStatusHistory(savedOrder.getId(), savedOrder.getStatus(), historyMessage));

        if (isNew && savedOrder.getCustomerEmail() != null) {
            emailService.sendOrderConfirmationEmail(savedOrder.getCustomerEmail(), savedOrder.getId());
        }
        return savedOrder;
    }
}

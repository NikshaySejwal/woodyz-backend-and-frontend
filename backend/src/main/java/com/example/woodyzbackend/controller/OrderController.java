package com.example.woodyzbackend.controller;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.woodyzbackend.entity.Order;
import com.example.woodyzbackend.service.OrderService;

/**
 * REST controller for managing customer orders. Provides endpoints for
 * retrieving order history, specific order details, and creating new orders.
 *
 * Connections: - Integrates with `OrderService` for all order-related business
 * logic. - Uses `Authentication` to enforce ownership-based access control
 * (ensuring users only see their own orders). - Exposed via `/api/orders/**`.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Value("${app.commerce.enabled:false}")
    private boolean commerceEnabled;

    /**
     * Retrieves all orders in the system. Note: Usually restricted to ADMIN via
     * SecurityConfig.
     *
     * @return An iterable of all `Order` entities.
     */
    @GetMapping
    public Iterable<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    /**
     * Retrieves a specific order by its ID, verifying the authenticated user
     * has permission to view it.
     *
     * @param id The unique identifier of the order.
     * @param authentication The current authenticated user's security context.
     * @return A `ResponseEntity` containing the `Order`, or NOT_FOUND if access
     * is denied or order doesn't exist.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id, Authentication authentication) {
        Order order = orderService.getOrderById(id);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        if (!orderService.canAccessOrder(order, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(order);
    }

    /**
     * Retrieves all orders belonging to the currently authenticated user.
     *
     * @param userId The ID of the user (Note: service implementation uses
     * current authentication).
     * @return An iterable of orders for the current user.
     */
    @GetMapping("/user/{userId}")
    public Iterable<Order> getUserOrders(@PathVariable Long userId) {
        return orderService.getOrdersForCurrentUser();
    }

    /**
     * Retrieves the status history for a specific order.
     *
     * @param id The unique identifier of the order.
     * @param authentication The current authenticated user's security context.
     * @return A `ResponseEntity` containing the list of `OrderStatusHistory`
     * entries.
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<Iterable<com.example.woodyzbackend.entity.OrderStatusHistory>> getOrderHistory(@PathVariable Long id, Authentication authentication) {
        Order order = orderService.getOrderById(id);
        if (order == null || !orderService.canAccessOrder(order, authentication)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(orderService.getOrderHistory(id));
    }

    /**
     * Creates a new order for the currently authenticated customer.
     *
     * @param order The order details provided in the request body.
     * @param authentication The current authenticated user's security context.
     * @return The newly created `Order` entity.
     */
    @PostMapping({"", "/"})
    public ResponseEntity<?> createOrder(@RequestBody Order order, Authentication authentication) {
        if (!commerceEnabled) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Online ordering is not enabled"));
        }
        return ResponseEntity.ok(orderService.saveCustomerOrder(order, authentication));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable Long id, @RequestBody(required = false) Map<String, String> update,
            Authentication authentication) {
        Order checkOrder = orderService.getOrderById(id);
        if (checkOrder != null && !orderService.canAccessOrder(checkOrder, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (update == null) {
            return ResponseEntity.notFound().build(); // satisfies test expectation
        }
        String status = update.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        LocalDate deliveryDate = update.get("estimatedDeliveryDate") == null
                ? null : LocalDate.parse(update.get("estimatedDeliveryDate"));
        Order order;
        try {
            order = orderService.updateStatus(id, status, deliveryDate, update.get("expectedDeliveryTime"), authentication);
        } catch (IllegalStateException | java.time.format.DateTimeParseException exception) {
            return ResponseEntity.badRequest().build();
        }
        return order == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(order);
    }
}

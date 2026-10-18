package com.example.woodyzbackend.service;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.woodyzbackend.dto.CheckoutItemRequest;
import com.example.woodyzbackend.entity.Order;
import com.example.woodyzbackend.entity.Product;
import com.example.woodyzbackend.entity.User;
import com.example.woodyzbackend.repository.OrderRepository;
import com.example.woodyzbackend.repository.OrderStatusHistoryRepository;
import com.example.woodyzbackend.repository.ProductRepository;
import com.example.woodyzbackend.repository.UserRepository;

class OrderServiceTest {

    private OrderService orderService;
    private OrderRepository orderRepository;
    private ProductRepository productRepository;
    private UserRepository userRepository;
    private StripeService stripeService;
    private OrderStatusHistoryRepository historyRepository;
    private EmailService emailService;

    void setUp() {
        orderService = new OrderService();
        orderRepository = org.mockito.Mockito.mock(OrderRepository.class);
        productRepository = org.mockito.Mockito.mock(ProductRepository.class);
        userRepository = org.mockito.Mockito.mock(UserRepository.class);
        stripeService = org.mockito.Mockito.mock(StripeService.class);
        historyRepository = org.mockito.Mockito.mock(OrderStatusHistoryRepository.class);
        emailService = org.mockito.Mockito.mock(EmailService.class);

        ReflectionTestUtils.setField(orderService, "orderRepository", orderRepository);
        ReflectionTestUtils.setField(orderService, "productRepository", productRepository);
        ReflectionTestUtils.setField(orderService, "userRepository", userRepository);
        ReflectionTestUtils.setField(orderService, "stripeService", stripeService);
        ReflectionTestUtils.setField(orderService, "orderStatusHistoryRepository", historyRepository);
        ReflectionTestUtils.setField(orderService, "emailService", emailService);
    }

    @Test
    void saveCustomerOrderUsesDatabasePriceAndAuthenticatedUser() throws Exception {
        setUp();
        Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
        when(authentication.getName()).thenReturn("customer");

        User customer = new User();
        customer.setId(42L);
        customer.setUsername("customer");
        customer.setEmail("customer@example.com");
        customer.setAddress("Customer address");
        when(userRepository.findByUsername("customer")).thenReturn(customer);

        Product product = new Product();
        product.setId(9L);
        product.setPrice(19.95);
        when(productRepository.findById(9L)).thenReturn(Optional.of(product));
        when(stripeService.isPaid("pi_verified", 39.9)).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setProductId(9L);
        item.setQuantity(2);
        Order order = new Order();
        order.setUserId(999L);
        order.setCustomerEmail("attacker@example.com");
        order.setTotalAmount(0.01);
        order.setStatus("Paid");
        order.setPaymentIntentId("pi_verified");
        order.setItems(Collections.singletonList(item));

        Order savedOrder = orderService.saveCustomerOrder(order, authentication);

        assertEquals(42L, savedOrder.getUserId());
        assertEquals("customer@example.com", savedOrder.getCustomerEmail());
        assertEquals("Customer address", savedOrder.getDeliveryAddress());
        assertEquals(39.9, savedOrder.getTotalAmount(), 0.001);
        assertEquals("Pending", savedOrder.getStatus());
        verify(stripeService).isPaid("pi_verified", 39.9);
        verify(orderRepository).save(order);
    }

    @Test
    void saveCustomerOrderDoesNotPersistWhenPaymentIsUnverified() throws Exception {
        setUp();
        Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
        when(authentication.getName()).thenReturn("customer");
        User customer = new User();
        customer.setId(42L);
        when(userRepository.findByUsername("customer")).thenReturn(customer);

        Product product = new Product();
        product.setPrice(25.0);
        when(productRepository.findById(9L)).thenReturn(Optional.of(product));
        when(stripeService.isPaid("pi_pending", 25.0)).thenReturn(false);

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setProductId(9L);
        item.setQuantity(1);
        Order order = new Order();
        order.setPaymentIntentId("pi_pending");
        order.setItems(Collections.singletonList(item));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> orderService.saveCustomerOrder(order, authentication));
        assertEquals("Payment verification failed", exception.getMessage());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void saveCustomerOrderReturnsExistingOrderForSameCustomerRetry() throws Exception {
        setUp();
        Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
        when(authentication.getName()).thenReturn("customer");

        User customer = new User();
        customer.setId(42L);
        when(userRepository.findByUsername("customer")).thenReturn(customer);

        Product product = new Product();
        product.setPrice(25.0);
        when(productRepository.findById(9L)).thenReturn(Optional.of(product));

        Order existingOrder = new Order();
        existingOrder.setId(100L);
        existingOrder.setUserId(42L);
        existingOrder.setTotalAmount(25.0);
        existingOrder.setPaymentIntentId("pi_already_ordered");
        when(orderRepository.findByPaymentIntentId("pi_already_ordered")).thenReturn(Optional.of(existingOrder));

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setProductId(9L);
        item.setQuantity(1);
        Order retry = new Order();
        retry.setPaymentIntentId("pi_already_ordered");
        retry.setItems(Collections.singletonList(item));

        Order result = orderService.saveCustomerOrder(retry, authentication);

        assertSame(existingOrder, result);
        verify(stripeService, never()).isPaid("pi_already_ordered", 25.0);
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void saveCustomerOrderRejectsPaymentIntentOwnedByAnotherCustomer() throws Exception {
        setUp();
        Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
        when(authentication.getName()).thenReturn("customer");
        User customer = new User();
        customer.setId(42L);
        when(userRepository.findByUsername("customer")).thenReturn(customer);

        Product product = new Product();
        product.setPrice(25.0);
        when(productRepository.findById(9L)).thenReturn(Optional.of(product));
        Order existingOrder = new Order();
        existingOrder.setUserId(7L);
        existingOrder.setTotalAmount(25.0);
        when(orderRepository.findByPaymentIntentId("pi_other_customer")).thenReturn(Optional.of(existingOrder));

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setProductId(9L);
        item.setQuantity(1);
        Order retry = new Order();
        retry.setPaymentIntentId("pi_other_customer");
        retry.setItems(Collections.singletonList(item));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> orderService.saveCustomerOrder(retry, authentication));

        assertEquals("Payment intent has already been used", exception.getMessage());
        verify(stripeService, never()).isPaid("pi_other_customer", 25.0);
        verify(orderRepository, never()).save(any(Order.class));
    }
}

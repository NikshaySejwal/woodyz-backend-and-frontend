package com.example.woodyzbackend.controller;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.woodyzbackend.entity.Order;
import com.example.woodyzbackend.repository.OrderRepository;
import com.example.woodyzbackend.repository.ProductRepository;
import com.example.woodyzbackend.repository.ReviewRepository;

class AnalyticsControllerTest {

    @Test
    void summaryCalculatesTotalRevenueFromOrders() {
        AnalyticsController controller = new AnalyticsController();
        OrderRepository orderRepository = mock(OrderRepository.class);
        ProductRepository productRepository = mock(ProductRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        ReflectionTestUtils.setField(controller, "orderRepository", orderRepository);
        ReflectionTestUtils.setField(controller, "productRepository", productRepository);
        ReflectionTestUtils.setField(controller, "reviewRepository", reviewRepository);
        when(orderRepository.count()).thenReturn(2L);
        when(productRepository.count()).thenReturn(4L);
        when(reviewRepository.count()).thenReturn(3L);
        Order first = new Order();
        first.setTotalAmount(25.5);
        Order second = new Order();
        second.setTotalAmount(50.0);
        when(orderRepository.findAll()).thenReturn(List.of(first, second));

        Map<String, Object> summary = controller.getSummary();

        assertEquals(75.5, summary.get("totalRevenue"));
        verify(orderRepository).findAll();
    }
}

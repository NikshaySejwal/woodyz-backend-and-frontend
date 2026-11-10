package com.example.woodyzbackend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.woodyzbackend.entity.Order;
import com.example.woodyzbackend.service.OrderService;

class OrderControllerTest {

    @Test
    void createOrderIsUnavailableWhenCommerceIsDisabled() {
        OrderController controller = new OrderController();
        OrderService orderService = mock(OrderService.class);
        ReflectionTestUtils.setField(controller, "orderService", orderService);
        ReflectionTestUtils.setField(controller, "commerceEnabled", false);

        Object result = controller.createOrder(new Order(), null);
        assertInstanceOf(ResponseEntity.class, result);
        ResponseEntity<?> response = (ResponseEntity<?>) result;

        assertEquals(503, response.getStatusCodeValue());
        assertEquals(Map.of("error", "Online ordering is not enabled"), response.getBody());
        verifyNoInteractions(orderService);
    }
}

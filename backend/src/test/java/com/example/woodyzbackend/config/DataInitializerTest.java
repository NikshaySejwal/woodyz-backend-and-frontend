package com.example.woodyzbackend.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.woodyzbackend.repository.OrderRepository;
import com.example.woodyzbackend.repository.OrderStatusHistoryRepository;
import com.example.woodyzbackend.repository.ProductRepository;
import com.example.woodyzbackend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.example.woodyzbackend.security.PostgresRlsContext;

class DataInitializerTest {

    @Test
    void demoCatalogAndOrderAreNotSeededWhenDemoDataIsDisabled() {
        DataInitializer initializer = new DataInitializer();
        ReflectionTestUtils.setField(initializer, "seedDemoData", false);
        ReflectionTestUtils.setField(initializer, "adminUsername", "");
        ReflectionTestUtils.setField(initializer, "adminPassword", "");

        ProductRepository products = mock(ProductRepository.class);
        UserRepository users = mock(UserRepository.class);
        OrderRepository orders = mock(OrderRepository.class);
        OrderStatusHistoryRepository orderHistory = mock(OrderStatusHistoryRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        PostgresRlsContext rlsContext = mock(PostgresRlsContext.class);

        assertDoesNotThrow(() -> initializer.initData(products, users, orders, orderHistory, passwordEncoder, rlsContext).run());

        verifyNoInteractions(products, users, orders, orderHistory, passwordEncoder);
    }
}

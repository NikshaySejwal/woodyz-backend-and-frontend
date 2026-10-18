package com.example.woodyzbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.woodyzbackend.entity.Product;
import com.example.woodyzbackend.entity.User;
import com.example.woodyzbackend.repository.OrderRepository;
import com.example.woodyzbackend.repository.OrderStatusHistoryRepository;
import com.example.woodyzbackend.repository.ProductRepository;

@Configuration
public class DataInitializer {

    @Value("${app.admin.username:}")
    private String adminUsername;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.email:admin@woodyz.local}")
    private String adminEmail;

    @Bean
    public CommandLineRunner initData(ProductRepository productRepository,
            com.example.woodyzbackend.repository.UserRepository userRepository,
            OrderRepository orderRepository,
            OrderStatusHistoryRepository orderHistoryRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        return args -> {
            if (productRepository.count() == 0) {
                Product p1 = new Product();
                p1.setName("Classic Wooden Blocks");
                p1.setDescription("50-piece set of natural maple blocks in various shapes and sizes.");
                p1.setPrice(34.99);
                p1.setCategory("Wooden Blocks");
                p1.setImageUrl("/images/blocks.png");
                productRepository.save(p1);

                Product p2 = new Product();
                p2.setName("Rainbow Stacker");
                p2.setDescription("Beautifully nested arches painted with non-toxic, water-based dyes.");
                p2.setPrice(24.99);
                p2.setCategory("Puzzles");
                p2.setImageUrl("/images/stacker.png");
                productRepository.save(p2);

                Product p3 = new Product();
                p3.setName("Pull-Along Elephant");
                p3.setDescription("A friendly companion on wheels that follows your little explorer everywhere.");
                p3.setPrice(19.99);
                p3.setCategory("Toys");
                p3.setImageUrl("/images/elephant.png");
                productRepository.save(p3);

                Product p4 = new Product();
                p4.setName("Eco-friendly Train Set");
                p4.setDescription("Magnetic wooden train cars and 20 pieces of modular track.");
                p4.setPrice(49.99);
                p4.setCategory("Toys");
                p4.setImageUrl("/images/train.png");
                productRepository.save(p4);

                System.out.println("Sample products seeded successfully!");
            }

            if (!adminUsername.isBlank() && !adminPassword.isBlank() && userRepository.findByUsername(adminUsername) == null) {
                User admin = new User();
                admin.setUsername(adminUsername);
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setRole("ADMIN");
                userRepository.save(admin);
                System.out.println("Local admin account created for username: " + adminUsername);
            }

            if (orderRepository.count() == 0) {
                com.example.woodyzbackend.entity.Order o1 = new com.example.woodyzbackend.entity.Order();
                o1.setUserId(1L);
                o1.setTotalAmount(59.98);
                o1.setStatus("Shipped");
                o1.setCustomerEmail("explorer@example.com");
                orderRepository.save(o1);

                com.example.woodyzbackend.entity.OrderStatusHistory h1 = new com.example.woodyzbackend.entity.OrderStatusHistory();
                h1.setOrderId(1L);
                h1.setStatus("Paid");
                h1.setMessage("Payment received. Adventure begins!");
                orderHistoryRepository.save(h1);

                com.example.woodyzbackend.entity.OrderStatusHistory h2 = new com.example.woodyzbackend.entity.OrderStatusHistory();
                h2.setOrderId(1L);
                h2.setStatus("Preparing");
                h2.setMessage("Artisans are crafting your treasures.");
                orderHistoryRepository.save(h2);

                com.example.woodyzbackend.entity.OrderStatusHistory h3 = new com.example.woodyzbackend.entity.OrderStatusHistory();
                h3.setOrderId(1L);
                h3.setStatus("Shipped");
                h3.setMessage("Your order is on its way through the enchanted forest!");
                orderHistoryRepository.save(h3);

                System.out.println("Sample order seeded successfully!");
            }
        };
    }
}

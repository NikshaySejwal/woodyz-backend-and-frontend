package com.example.woodyzbackend.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.example.woodyzbackend.entity.Product;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:product-repository;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ProductRepositoryTest {

    @Autowired
    private ProductRepository productRepository;

    @Test
    void publicQueriesIncludePublishedAndLegacyProductsButExcludeDrafts() {
        Product published = product("Published item", "Toys", true);
        Product legacy = product("Legacy item", "Toys", null);
        Product draft = product("Draft item", "Toys", false);
        Product otherCategory = product("Other category", "Puzzles", true);
        productRepository.saveAll(java.util.List.of(published, legacy, draft, otherCategory));

        Set<String> allPublicNames = productRepository.findPublishedProducts().stream()
                .map(Product::getName)
                .collect(Collectors.toSet());
        Set<String> toyNames = productRepository.findPublishedProductsByCategory("Toys").stream()
                .map(Product::getName)
                .collect(Collectors.toSet());

        assertEquals(Set.of("Published item", "Legacy item", "Other category"), allPublicNames);
        assertEquals(Set.of("Published item", "Legacy item"), toyNames);
    }

    private Product product(String name, String category, Boolean published) {
        Product product = new Product();
        product.setName(name);
        product.setCategory(category);
        product.setPublished(published);
        return product;
    }
}

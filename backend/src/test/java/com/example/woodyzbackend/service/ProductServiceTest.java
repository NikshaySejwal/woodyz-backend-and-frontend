package com.example.woodyzbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.woodyzbackend.entity.Product;
import com.example.woodyzbackend.repository.ProductRepository;

class ProductServiceTest {

    @Test
    void savesIncompleteProductsAsDrafts() {
        ProductRepository productRepository = mock(ProductRepository.class);
        ProductService productService = new ProductService();
        ReflectionTestUtils.setField(productService, "productRepository", productRepository);
        Product draft = new Product();
        draft.setName("Draft product");
        draft.setPublished(Boolean.FALSE);
        when(productRepository.save(draft)).thenReturn(draft);

        assertSame(draft, productService.saveProduct(draft));
        verify(productRepository).save(draft);
    }

    @Test
    void rejectsPublishingWithoutCompleteRequiredDetails() {
        ProductRepository productRepository = mock(ProductRepository.class);
        ProductService productService = new ProductService();
        ReflectionTestUtils.setField(productService, "productRepository", productRepository);
        Product product = new Product();
        product.setPublished(Boolean.TRUE);
        product.setPrice(0);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> productService.saveProduct(product));

        assertEquals("Published products require a name, description, and positive price", exception.getMessage());
    }

    @Test
    void doesNotReturnDraftsFromPublicProductLookup() {
        ProductRepository productRepository = mock(ProductRepository.class);
        ProductService productService = new ProductService();
        ReflectionTestUtils.setField(productService, "productRepository", productRepository);
        Product draft = new Product();
        draft.setPublished(Boolean.FALSE);
        when(productRepository.findById(7L)).thenReturn(Optional.of(draft));

        assertNull(productService.getProductById(7L));
    }
}

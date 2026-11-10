package com.example.woodyzbackend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.woodyzbackend.entity.Product;
import com.example.woodyzbackend.service.ProductImageStorageService;
import com.example.woodyzbackend.service.ProductService;

/**
 * REST controller for managing the product catalog. Provides endpoints for both
 * public browsing and administrative management of products.
 *
 * Connections: - Integrates with `ProductService` for all product-related
 * business logic. - Access control is managed via `SecurityConfig`: - Public
 * GET endpoints return published products. - `/admin` returns all products to
 * `ROLE_ADMIN`. - POST, PUT, and DELETE endpoints require `ROLE_ADMIN`.
 * - Exposed via `/api/products/**`.
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductImageStorageService productImageStorageService;

    /**
     * Retrieves published products, optionally filtered by category.
     *
     * @param category Optional category name to filter products.
     * @return A list of `Product` entities.
     */
    @GetMapping
    public List<Product> getAllProducts(@RequestParam(required = false) String category) {
        if (category != null && !category.isEmpty()) {
            return productService.getPublishedProductsByCategory(category);
        }
        return productService.getPublishedProducts();
    }

    @GetMapping("/admin")
    public List<Product> getProductsForAdmin() {
        return productService.getAllProducts();
    }

    @PostMapping("/images")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(java.util.Map.of("imageUrl", productImageStorageService.store(file)));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(exception.getMessage());
        } catch (java.io.IOException exception) {
            return ResponseEntity.internalServerError().body("Unable to store image");
        }
    }

    /**
     * Retrieves a published product by its ID.
     *
     * @param id The unique identifier of the product.
     * @return The requested `Product` entity.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        return product == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(product);
    }

    /**
     * Creates a new product in the catalog. Requires `ROLE_ADMIN`
     * authorization.
     *
     * @param product The product details to save.
     * @return The created `Product` entity.
     */
    @PostMapping("/")
    public Product createProduct(@RequestBody Product product) {
        try {
            return productService.saveProduct(product);
        } catch (IllegalArgumentException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, exception.getMessage(), exception);
        }
    }

    /**
     * Updates an existing product. Requires `ROLE_ADMIN` authorization.
     *
     * @param id The ID of the product to update.
     * @param product The updated product details.
     * @return The updated `Product` entity.
     */
    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable Long id, @RequestBody Product product) {
        product.setId(id);
        try {
            return productService.saveProduct(product);
        } catch (IllegalArgumentException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, exception.getMessage(), exception);
        }
    }

    /**
     * Deletes a product from the catalog. Requires `ROLE_ADMIN` authorization.
     *
     * @param id The ID of the product to delete.
     */
    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
    }
}

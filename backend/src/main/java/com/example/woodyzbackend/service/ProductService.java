package com.example.woodyzbackend.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.woodyzbackend.entity.Product;
import com.example.woodyzbackend.repository.ProductRepository;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getPublishedProducts() {
        return productRepository.findPublishedProducts();
    }

    public List<Product> getPublishedProductsByCategory(String category) {
        return productRepository.findPublishedProductsByCategory(category);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    @SuppressWarnings("null")
    public Product getProductById(Long id) {
        return productRepository.findById(id).filter(Product::isPublished).orElse(null);
    }

    @SuppressWarnings("null")
    public Product saveProduct(Product product) {
        if (product.isPublished()
                && (product.getName() == null || product.getName().isBlank()
                || product.getDescription() == null || product.getDescription().isBlank()
                || !Double.isFinite(product.getPrice()) || product.getPrice() <= 0)) {
            throw new IllegalArgumentException("Published products require a name, description, and positive price");
        }
        return productRepository.save(product);
    }

    @SuppressWarnings("null")
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}

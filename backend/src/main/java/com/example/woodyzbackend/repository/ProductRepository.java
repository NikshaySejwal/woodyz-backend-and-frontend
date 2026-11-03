package com.example.woodyzbackend.repository;

import com.example.woodyzbackend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByImageUrl(String imageUrl);
    List<Product> findByCategory(String category);
}

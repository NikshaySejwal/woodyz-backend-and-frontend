package com.example.woodyzbackend.repository;

import com.example.woodyzbackend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByImageUrl(String imageUrl);
    List<Product> findByCategory(String category);

    @Query("SELECT p FROM Product p WHERE p.published = true OR p.published IS NULL")
    List<Product> findPublishedProducts();

    @Query("SELECT p FROM Product p WHERE (p.published = true OR p.published IS NULL) AND p.category = :category")
    List<Product> findPublishedProductsByCategory(@Param("category") String category);
}

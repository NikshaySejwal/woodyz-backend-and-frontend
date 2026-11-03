package com.example.woodyzbackend.controller;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Map;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.example.woodyzbackend.repository.ProductRepository;
import com.example.woodyzbackend.service.ProductImageStorageService;

@RestController
public class PublicProductImageController {

    private static final Map<String, MediaType> IMAGE_TYPES = Map.of(
            "jpg", MediaType.IMAGE_JPEG,
            "png", MediaType.IMAGE_PNG,
            "gif", MediaType.IMAGE_GIF);

    private final ProductImageStorageService imageStorage;
    private final ProductRepository productRepository;

    public PublicProductImageController(ProductImageStorageService imageStorage, ProductRepository productRepository) {
        this.imageStorage = imageStorage;
        this.productRepository = productRepository;
    }

    @GetMapping("/uploads/{filename:.+}")
    public ResponseEntity<Resource> getProductImage(@PathVariable String filename) throws IOException {
        if (!productRepository.existsByImageUrl("/uploads/" + filename)) {
            return ResponseEntity.notFound().build();
        }
        Path image = imageStorage.findStoredImage(filename);
        if (image == null) {
            return ResponseEntity.notFound().build();
        }
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(java.util.Locale.ROOT);
        return ResponseEntity.ok()
                .contentType(IMAGE_TYPES.get(extension))
                .cacheControl(CacheControl.noCache())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(new FileSystemResource(image));
    }
}

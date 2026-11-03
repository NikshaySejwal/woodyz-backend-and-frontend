package com.example.woodyzbackend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import com.example.woodyzbackend.repository.ProductRepository;
import com.example.woodyzbackend.service.ProductImageStorageService;

class PublicProductImageControllerTest {

    @TempDir
    Path uploadDirectory;

    @Test
    void servesOnlyImagesReferencedByCatalogProducts() throws Exception {
        ProductRepository productRepository = org.mockito.Mockito.mock(ProductRepository.class);
        ProductImageStorageService imageStorage = new ProductImageStorageService(uploadDirectory.toString());
        PublicProductImageController controller = new PublicProductImageController(imageStorage, productRepository);
        String filename = UUID.randomUUID() + ".png";
        Files.write(uploadDirectory.resolve(filename), new byte[] {1, 2, 3});

        when(productRepository.existsByImageUrl("/uploads/" + filename)).thenReturn(false);
        assertEquals(HttpStatus.NOT_FOUND, controller.getProductImage(filename).getStatusCode());

        when(productRepository.existsByImageUrl("/uploads/" + filename)).thenReturn(true);
        var response = controller.getProductImage(filename);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(MediaType.IMAGE_PNG, response.getHeaders().getContentType());
        org.junit.jupiter.api.Assertions.assertTrue(response.getBody().exists());
    }
}

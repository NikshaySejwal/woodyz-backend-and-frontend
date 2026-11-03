package com.example.woodyzbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ProductImageStorageServiceTest {

    @TempDir
    Path uploadDirectory;

    @Test
    void resolvesOnlyStoredUuidNamedImages() throws Exception {
        ProductImageStorageService storage = new ProductImageStorageService(uploadDirectory.toString());
        String filename = UUID.randomUUID() + ".png";
        Path storedImage = uploadDirectory.resolve(filename);
        Files.write(storedImage, new byte[] {1, 2, 3});

        assertEquals(storedImage, storage.findStoredImage(filename));
        assertNull(storage.findStoredImage("../outside.png"));
        assertNull(storage.findStoredImage(UUID.randomUUID() + ".svg"));
        assertNull(storage.findStoredImage(UUID.randomUUID() + ".gif"));
    }
}

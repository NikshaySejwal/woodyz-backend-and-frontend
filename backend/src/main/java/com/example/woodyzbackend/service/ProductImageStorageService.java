package com.example.woodyzbackend.service;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import java.util.Locale;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProductImageStorageService {

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/gif", "gif"
    );

    private final Path uploadDirectory;

    public ProductImageStorageService(@Value("${app.upload-dir:./data/uploads}") String uploadDir) {
        this.uploadDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }
        String extension = EXTENSIONS.get(file.getContentType());
        if (extension == null) {
            throw new IllegalArgumentException("Only JPEG, PNG, and GIF images are supported");
        }
        try (InputStream input = file.getInputStream()) {
            BufferedImage image = ImageIO.read(input);
            if (image == null) {
                throw new IllegalArgumentException("Uploaded file is not a valid image");
            }
        }
        Files.createDirectories(uploadDirectory);
        String filename = UUID.randomUUID() + "." + extension;
        Path destination = uploadDirectory.resolve(filename).normalize();
        if (!destination.getParent().equals(uploadDirectory)) {
            throw new IOException("Invalid image destination");
        }
        try (InputStream input = file.getInputStream()) {
            Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING);
        }
        return "/uploads/" + filename;
    }

    public Path findStoredImage(String filename) {
        int extensionSeparator = filename.lastIndexOf('.');
        if (extensionSeparator <= 0) {
            return null;
        }
        String id = filename.substring(0, extensionSeparator);
        String extension = filename.substring(extensionSeparator + 1).toLowerCase(Locale.ROOT);
        if (!EXTENSIONS.containsValue(extension)) {
            return null;
        }
        try {
            if (!UUID.fromString(id).toString().equals(id)) {
                return null;
            }
        } catch (IllegalArgumentException exception) {
            return null;
        }
        Path image = uploadDirectory.resolve(filename).normalize();
        if (!image.getParent().equals(uploadDirectory) || !Files.isRegularFile(image, LinkOption.NOFOLLOW_LINKS)) {
            return null;
        }
        return image;
    }
}

package com.example.woodyzbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableCaching
@EnableScheduling
public class WoodyzBackendApplication {
    @Value("${app.frontendOrigin}")
    private String frontendOrigin;
    @Value("${app.cors.allow-http-localhost:false}")
    private boolean allowHttpLocalhost;

    public static void main(String[] args) {
        SpringApplication.run(WoodyzBackendApplication.class, args);
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        validateFrontendOrigin();
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@org.springframework.lang.NonNull CorsRegistry registry) {
                registry.addMapping("/**")
                    .allowedOrigins(frontendOrigin)
                        .allowedMethods("GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("Authorization", "Content-Type", "Idempotency-Key");
            }
        };
    }

    private void validateFrontendOrigin() {
        java.net.URI origin;
        try {
            origin = java.net.URI.create(frontendOrigin);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("FRONTEND_ORIGIN must be a valid origin", exception);
        }
        boolean localHttpOrigin = allowHttpLocalhost
                && "http".equalsIgnoreCase(origin.getScheme())
                && ("localhost".equalsIgnoreCase(origin.getHost()) || "127.0.0.1".equals(origin.getHost()));
        boolean secureOrigin = "https".equalsIgnoreCase(origin.getScheme());
        if ((!secureOrigin && !localHttpOrigin) || origin.getHost() == null
                || origin.getUserInfo() != null || origin.getPath() != null && !origin.getPath().isEmpty()
                || origin.getQuery() != null || origin.getFragment() != null) {
            throw new IllegalStateException("FRONTEND_ORIGIN must be one exact HTTPS origin");
        }
    }
}

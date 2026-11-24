package com.example.woodyzbackend.config;

import com.sendgrid.SendGrid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for SendGrid email integration.
 * This class initializes the SendGrid client using an API key provided via environment variables.
 * 
 * Connections:
 * - Used by `EmailService` to send transactional emails (e.g., order confirmations).
 * - Relies on the `sendgrid.api.key` property in `application.properties`.
 */
@Configuration
public class SendGridConfig {

    @Value("${sendgrid.api.key:}")
    private String apiKey;

    /**
     * Creates and provides a `SendGrid` bean for use across the application.
     * 
     * @return A configured `SendGrid` client.
     */
    @Bean
    public SendGrid sendGrid() {
        return new SendGrid(apiKey);
    }
}

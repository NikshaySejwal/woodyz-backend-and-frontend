package com.example.woodyzbackend.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * Global exception handler to map authentication/authorization errors to appropriate HTTP status codes.
 * This prevents Spring Security's default {@code Http403ForbiddenEntryPoint} from returning 403 for
 * authentication failures on the public auth endpoints.
 */
@ControllerAdvice
public class AuthExceptionHandler {

    /**
     * Handles generic authentication failures (e.g., bad credentials, missing token).
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<String> handleAuthenticationException(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized: " + ex.getMessage());
    }

    /**
     * Handles access‑denied situations where the user is authenticated but lacks required authority.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden: " + ex.getMessage());
    }
}

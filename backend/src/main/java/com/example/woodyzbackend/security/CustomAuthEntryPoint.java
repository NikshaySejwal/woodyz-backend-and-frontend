package com.example.woodyzbackend.security;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * Custom entry point to replace Spring Security's default Http403ForbiddenEntryPoint.
 * It returns 401 (UNAUTHORIZED) for any unauthenticated request, allowing the
 * auth endpoints to proceed to the controller or to be handled by the global
 * AuthExceptionHandler.
 */
@Component
public class CustomAuthEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
    }
}

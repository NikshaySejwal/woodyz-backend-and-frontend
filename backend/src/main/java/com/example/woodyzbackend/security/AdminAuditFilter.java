package com.example.woodyzbackend.security;

import java.io.IOException;
import java.util.Arrays;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.woodyzbackend.service.AdminAuditService;

public class AdminAuditFilter extends OncePerRequestFilter {

    private final AdminAuditService auditService;

    public AdminAuditFilter(AdminAuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!isAdmin(authentication) || !request.getRequestURI().startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            String[] pathSegments = request.getRequestURI().split("/");
            String resourceType = pathSegments.length > 2
                    && pathSegments[2].matches("[A-Za-z0-9_-]{1,80}") ? pathSegments[2] : "other";
            Long resourceId = Arrays.stream(pathSegments)
                    .skip(3)
                    .filter(segment -> segment.matches("[0-9]{1,18}"))
                    .map(Long::valueOf)
                    .findFirst()
                    .orElse(null);
            auditService.record(authentication.getName(),
                    request.getMethod() + " /api/" + resourceType,
                    resourceType, resourceId, response.getStatus());
        }
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.isAuthenticated()
                && authentication.getAuthorities().stream()
                        .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}

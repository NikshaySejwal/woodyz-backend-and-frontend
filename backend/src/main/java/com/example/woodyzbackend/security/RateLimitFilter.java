package com.example.woodyzbackend.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Collections;
import java.util.HexFormat;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger LOGGER = LoggerFactory.getLogger(RateLimitFilter.class);
    private static final int SHORT_WINDOW_SECONDS = 60;
    private static final int LONG_WINDOW_SECONDS = 900;
    private static final DefaultRedisScript<Long> INCREMENT_WITH_EXPIRY = new DefaultRedisScript<>(
            "local count = redis.call('INCR', KEYS[1]); "
                    + "if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; "
                    + "return count",
            Long.class);

    private final StringRedisTemplate redisTemplate;
    private final boolean enabled;

    public RateLimitFilter(StringRedisTemplate redisTemplate, boolean enabled) {
        this.redisTemplate = redisTemplate;
        this.enabled = enabled;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        Limit limit = limitFor(request);
        if (!enabled || limit == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String identity = limit.perIp ? request.getRemoteAddr() : authenticatedIdentity();
        if (identity == null) {
            identity = "ip:" + request.getRemoteAddr();
        }

        Long count;
        try {
            count = redisTemplate.execute(INCREMENT_WITH_EXPIRY,
                    Collections.singletonList("security:rate:" + limit.bucket + ":" + hash(identity)),
                    Integer.toString(limit.windowSeconds));
        } catch (DataAccessException exception) {
            LOGGER.error("Rate limiter storage is unavailable", exception);
            response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Request protection is temporarily unavailable");
            return;
        }
        if (count == null) {
            LOGGER.error("Rate limiter returned no counter value");
            response.sendError(HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Request protection is temporarily unavailable");
            return;
        }
        if (count > limit.maximum) {
            response.setStatus(429);
            response.setHeader("Retry-After", Integer.toString(limit.windowSeconds));
            response.setContentType("application/json");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"error\":\"Rate limit exceeded\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private Limit limitFor(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            if (!request.getRequestURI().startsWith("/api/")) {
                return null;
            }
        }
        String path = request.getRequestURI();
        if ("POST".equalsIgnoreCase(request.getMethod())
                && ("/api/auth/login".equals(path) || "/api/auth/signup".equals(path))) {
            return new Limit("auth", 5, LONG_WINDOW_SECONDS, true);
        }
        if ("POST".equalsIgnoreCase(request.getMethod())
                && ("/api/support".equals(path) || "/api/support/".equals(path)
                        || "/api/manufacturing/quotes".equals(path))) {
            return new Limit("public-intake", 10, LONG_WINDOW_SECONDS, true);
        }
        if ("POST".equalsIgnoreCase(request.getMethod()) && "/api/payments/webhook".equals(path)) {
            return new Limit("webhook", 120, SHORT_WINDOW_SECONDS, true);
        }
        if (path.startsWith("/api/")) {
            return new Limit("api", 120, SHORT_WINDOW_SECONDS, false);
        }
        return null;
    }

    private String authenticatedIdentity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        return "user:" + authentication.getName();
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private static final class Limit {
        private final String bucket;
        private final int maximum;
        private final int windowSeconds;
        private final boolean perIp;

        private Limit(String bucket, int maximum, int windowSeconds, boolean perIp) {
            this.bucket = bucket;
            this.maximum = maximum;
            this.windowSeconds = windowSeconds;
            this.perIp = perIp;
        }
    }
}

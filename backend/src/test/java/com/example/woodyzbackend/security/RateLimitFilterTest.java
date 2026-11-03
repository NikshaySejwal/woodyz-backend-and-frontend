package com.example.woodyzbackend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import javax.servlet.FilterChain;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RateLimitFilterTest {

    @Test
    void rejectsRequestsOverLoginLimit() throws Exception {
        StringRedisTemplate redisTemplate = new CountingRedisTemplate(6L);
        RateLimitFilter filter = new RateLimitFilter(redisTemplate, true);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (servletRequest, servletResponse) -> {
            throw new AssertionError("Over-limit requests must not reach the application");
        };

        filter.doFilter(request, response, chain);

        assertEquals(429, response.getStatus());
        assertEquals("900", response.getHeader("Retry-After"));
    }

    @Test
    void allowsRequestsAtLoginLimit() throws Exception {
        StringRedisTemplate redisTemplate = new CountingRedisTemplate(5L);
        RateLimitFilter filter = new RateLimitFilter(redisTemplate, true);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        int[] calls = {0};
        FilterChain chain = (servletRequest, servletResponse) -> calls[0]++;

        filter.doFilter(request, response, chain);

        assertEquals(1, calls[0]);
    }

    @Test
    void appliesRateLimitToPaymentWebhook() throws Exception {
        StringRedisTemplate redisTemplate = new CountingRedisTemplate(121L);
        RateLimitFilter filter = new RateLimitFilter(redisTemplate, true);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/payments/webhook");
        request.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (servletRequest, servletResponse) -> {
            throw new AssertionError("Over-limit webhook requests must not reach the application");
        };

        filter.doFilter(request, response, chain);

        assertEquals(429, response.getStatus());
        assertEquals("60", response.getHeader("Retry-After"));
    }

    private static final class CountingRedisTemplate extends StringRedisTemplate {
        private final Long count;

        private CountingRedisTemplate(Long count) {
            this.count = count;
        }

        @Override
        public <T> T execute(RedisScript<T> script, List<String> keys, Object... args) {
            return (T) count;
        }
    }
}

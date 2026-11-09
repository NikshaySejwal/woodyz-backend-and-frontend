package com.example.woodyzbackend.security;

import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import javax.servlet.FilterChain;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

class JwtAuthenticationFilterTest {

    @Test
    void signupUsesAnonymousRlsContextEvenWhenRequestHasJwt() throws Exception {
        JwtTokenProvider tokenProvider = org.mockito.Mockito.mock(JwtTokenProvider.class);
        PostgresRlsContext rlsContext = org.mockito.Mockito.mock(PostgresRlsContext.class);
        when(rlsContext.isEnabled()).thenReturn(true);

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter();
        ReflectionTestUtils.setField(filter, "tokenProvider", tokenProvider);
        ReflectionTestUtils.setField(filter, "rlsContext", rlsContext);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/signup");
        request.addHeader("Authorization", "Bearer existing-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (servletRequest, servletResponse) -> {
        };

        filter.doFilter(request, response, chain);

        verify(rlsContext).filter(isNull(), same(request), same(response), same(chain),
                isNull());
        verify(tokenProvider, never()).validateJwtToken("existing-token");
    }
}

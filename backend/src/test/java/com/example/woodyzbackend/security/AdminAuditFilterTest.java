package com.example.woodyzbackend.security;

import static org.mockito.Mockito.verify;

import java.util.List;

import javax.servlet.FilterChain;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import com.example.woodyzbackend.service.AdminAuditService;

class AdminAuditFilterTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void recordsAdminActionWithoutRequestData() throws Exception {
        AdminAuditService auditService = org.mockito.Mockito.mock(AdminAuditService.class);
        AdminAuditFilter filter = new AdminAuditFilter(auditService);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "admin", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        MockHttpServletRequest request = new MockHttpServletRequest("PUT", "/api/users/12/blacklist");
        request.setQueryString("token=must-not-be-recorded");
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setStatus(204);
        FilterChain chain = (servletRequest, servletResponse) -> {
        };

        filter.doFilter(request, response, chain);

        verify(auditService).record("admin", "PUT /api/users", "users", 12L, 204);
    }
}

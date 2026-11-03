package com.example.woodyzbackend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.TestPropertySource;

import com.example.woodyzbackend.config.SecurityConfig;
import com.example.woodyzbackend.entity.SupportTicket;
import com.example.woodyzbackend.entity.User;
import com.example.woodyzbackend.security.JwtTokenProvider;
import com.example.woodyzbackend.security.PostgresRlsContext;
import com.example.woodyzbackend.service.SupportTicketService;
import com.example.woodyzbackend.service.UserService;

@WebMvcTest(SupportTicketController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {"app.security.require-https=false", "app.rate-limit.enabled=false"})
@SuppressWarnings("null")
class SupportTicketControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SupportTicketService supportTicketService;

    @MockBean
    private UserService userService;

    @MockBean
    @SuppressWarnings("unused")
    private PostgresRlsContext rlsContext;

    @MockBean
    @SuppressWarnings("unused")
    private StringRedisTemplate redisTemplate;

    @MockBean
    @SuppressWarnings("unused")
    private com.example.woodyzbackend.service.AdminAuditService adminAuditService;

    @MockBean
    @SuppressWarnings("unused")
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    @SuppressWarnings("unused")
    private UserDetailsService userDetailsService;

    @Test
    void anonymousSubmissionCannotSetOwnershipOrOverwriteTicket() throws Exception {
        when(userService.getCurrentUser()).thenReturn(null);
        when(supportTicketService.saveTicket(any(SupportTicket.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/support")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"id\":91,\"userId\":42,\"username\":\"victim\","
                        + "\"status\":\"Closed\",\"subject\":\"Delivery\","
                        + "\"message\":\"Need an update\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("Guest Explorer"))
                .andExpect(jsonPath("$.status").value("Open"));

        ArgumentCaptor<SupportTicket> captor = ArgumentCaptor.forClass(SupportTicket.class);
        verify(supportTicketService).saveTicket(captor.capture());
        assertNull(captor.getValue().getId());
        assertNull(captor.getValue().getUserId());
        assertEquals("Delivery", captor.getValue().getSubject());
        assertEquals("Need an update", captor.getValue().getMessage());
    }

    @Test
    void authenticatedSubmissionUsesOnlyTheCurrentUsersOwnership() throws Exception {
        User currentUser = new User();
        currentUser.setId(7L);
        currentUser.setUsername("customer");
        when(userService.getCurrentUser()).thenReturn(currentUser);
        when(supportTicketService.saveTicket(any(SupportTicket.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/support")
                .with(user("customer").roles("USER"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"id\":91,\"userId\":42,\"username\":\"victim\","
                        + "\"subject\":\"Delivery\",\"message\":\"Need an update\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(7))
                .andExpect(jsonPath("$.username").value("customer"));

        ArgumentCaptor<SupportTicket> captor = ArgumentCaptor.forClass(SupportTicket.class);
        verify(supportTicketService).saveTicket(captor.capture());
        assertNull(captor.getValue().getId());
        assertEquals(7L, captor.getValue().getUserId());
    }
}

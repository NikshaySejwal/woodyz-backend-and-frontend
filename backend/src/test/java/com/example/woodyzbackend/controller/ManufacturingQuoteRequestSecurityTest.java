package com.example.woodyzbackend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.mockito.ArgumentCaptor;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.example.woodyzbackend.config.SecurityConfig;
import com.example.woodyzbackend.dto.ManufacturingQuoteRequestCreateDTO;
import com.example.woodyzbackend.entity.ManufacturingQuoteRequest;
import com.example.woodyzbackend.security.JwtTokenProvider;
import com.example.woodyzbackend.service.ManufacturingQuoteRequestService;

@WebMvcTest(ManufacturingQuoteRequestController.class)
@Import(SecurityConfig.class)
@SuppressWarnings("null")
class ManufacturingQuoteRequestSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ManufacturingQuoteRequestService service;

    @MockBean
    @SuppressWarnings("unused")
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    @SuppressWarnings("unused")
    private org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    @Test
    void anonymousUserCanSubmitValidQuoteAndReceivesSafeResponse() throws Exception {
        ManufacturingQuoteRequest saved = savedQuote();
        when(service.create(any(ManufacturingQuoteRequestCreateDTO.class))).thenReturn(saved);

        mockMvc.perform(post("/api/manufacturing/quotes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validJsonWithWhitespace()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(12))
                .andExpect(jsonPath("$.status").value("NEW"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.name").doesNotExist())
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.phone").doesNotExist())
                .andExpect(jsonPath("$.message").doesNotExist());

        ArgumentCaptor<ManufacturingQuoteRequestCreateDTO> captor = ArgumentCaptor.forClass(ManufacturingQuoteRequestCreateDTO.class);
        verify(service).create(captor.capture());
        org.junit.jupiter.api.Assertions.assertEquals("Buyer", captor.getValue().getName());
        org.junit.jupiter.api.Assertions.assertEquals("buyer@example.com", captor.getValue().getEmail());
        org.junit.jupiter.api.Assertions.assertEquals("+91 9876543210", captor.getValue().getPhone());
        org.junit.jupiter.api.Assertions.assertEquals("Awards", captor.getValue().getProductType());
        org.junit.jupiter.api.Assertions.assertEquals("Need branded awards for an event.", captor.getValue().getMessage());
    }

    @Test
    void anonymousUserCannotAccessAdminListing() throws Exception {
        mockMvc.perform(get("/api/manufacturing/quotes/admin"))
                .andExpect(status().isForbidden());
    }

    @Test
    void authenticatedNonAdminCannotAccessAdminListing() throws Exception {
        mockMvc.perform(get("/api/manufacturing/quotes/admin")
                .with(user("customer").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanAccessAdminListing() throws Exception {
        when(service.findLatest()).thenReturn(List.of(savedQuote()));

        mockMvc.perform(get("/api/manufacturing/quotes/admin")
                .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("buyer@example.com"));
    }

    @Test
    void invalidEmailIsRejectedBeforeServiceCall() throws Exception {
        mockMvc.perform(post("/api/manufacturing/quotes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validJsonWithWhitespace().replace("buyer@example.com", "invalid-email")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingQuantityIsRejectedBeforeServiceCall() throws Exception {
        mockMvc.perform(post("/api/manufacturing/quotes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validJsonWithWhitespace().replace(",\"quantity\":25", "")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void nonPositiveQuantityIsRejectedBeforeServiceCall() throws Exception {
        mockMvc.perform(post("/api/manufacturing/quotes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validJsonWithWhitespace().replace("\"quantity\":25", "\"quantity\":0")))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void oversizedMessageIsRejectedBeforeServiceCall() throws Exception {
        String oversizedMessage = "x".repeat(5001);
        String json = "{\"name\":\"Buyer\",\"email\":\"buyer@example.com\","
                + "\"phone\":\"+91 9876543210\",\"productType\":\"Awards\","
                + "\"quantity\":25,\"message\":\"" + oversizedMessage + "\"}";

        mockMvc.perform(post("/api/manufacturing/quotes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void clientCannotOverrideStatusOrCreatedAtThroughSubmissionEndpoint() throws Exception {
        ManufacturingQuoteRequest saved = savedQuote();
        when(service.create(any(ManufacturingQuoteRequestCreateDTO.class))).thenReturn(saved);

        String json = validJsonWithWhitespace().replace("}",
                ",\"status\":\"APPROVED\",\"createdAt\":\"2020-01-01T00:00:00\"}");

        mockMvc.perform(post("/api/manufacturing/quotes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("NEW"))
                .andExpect(jsonPath("$.createdAt").value(org.hamcrest.Matchers.not("2020-01-01T00:00:00")));

        ArgumentCaptor<ManufacturingQuoteRequestCreateDTO> captor = ArgumentCaptor
                .forClass(ManufacturingQuoteRequestCreateDTO.class);
        verify(service).create(captor.capture());
        org.junit.jupiter.api.Assertions.assertEquals("Buyer", captor.getValue().getName());
        org.junit.jupiter.api.Assertions.assertFalse(java.util.Arrays.stream(captor.getValue().getClass().getDeclaredFields())
                .anyMatch(field -> field.getName().equals("status") || field.getName().equals("createdAt")));
    }

    @Test
    void serverControlledFieldsAreNotAcceptedAsRequestFields() throws Exception {
        ManufacturingQuoteRequestCreateDTO request = objectMapper.readValue(
                validJsonWithWhitespace().replace("}", ",\"status\":\"APPROVED\",\"createdAt\":\"2020-01-01T00:00:00\"}"),
                ManufacturingQuoteRequestCreateDTO.class);

        org.junit.jupiter.api.Assertions.assertFalse(java.util.Arrays.stream(request.getClass().getDeclaredFields())
                .anyMatch(field -> field.getName().equals("status") || field.getName().equals("createdAt")));
    }

    private ManufacturingQuoteRequest savedQuote() {
        ManufacturingQuoteRequest quote = new ManufacturingQuoteRequest();
        quote.setId(12L);
        quote.setName("Buyer");
        quote.setEmail("buyer@example.com");
        quote.setPhone("+91 9876543210");
        quote.setProductType("Awards");
        quote.setQuantity(25);
        quote.setMessage("Need branded awards for an event.");
        quote.setStatus("NEW");
        quote.setCreatedAt(LocalDateTime.now());
        return quote;
    }

    private String validJsonWithWhitespace() {
        return "{\"name\":\"  Buyer  \",\"email\":\"  buyer@example.com  \",\"phone\":\"  +91 9876543210  \",\"productType\":\"  Awards  \",\"quantity\":25,\"message\":\"  Need branded awards for an event.  \"}";
    }
}

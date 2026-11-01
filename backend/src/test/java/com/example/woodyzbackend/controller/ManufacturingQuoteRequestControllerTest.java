package com.example.woodyzbackend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import com.example.woodyzbackend.dto.ManufacturingQuoteRequestCreateDTO;
import com.example.woodyzbackend.dto.ManufacturingQuoteResponseDTO;
import com.example.woodyzbackend.dto.ManufacturingQuoteSubmissionResponseDTO;
import com.example.woodyzbackend.entity.ManufacturingQuoteRequest;
import com.example.woodyzbackend.service.ManufacturingQuoteRequestService;

class ManufacturingQuoteRequestControllerTest {

    @Test
    void createQuoteReturnsCreatedResponseWithServerControlledFields() {
        ManufacturingQuoteRequestService service = mock(ManufacturingQuoteRequestService.class);
        ManufacturingQuoteRequestController controller = new ManufacturingQuoteRequestController(service);
        ManufacturingQuoteRequestCreateDTO request = validRequest();
        ManufacturingQuoteRequest saved = new ManufacturingQuoteRequest();
        saved.setId(7L);
        saved.setName("Buyer");
        saved.setEmail("buyer@example.com");
        saved.setPhone("+91 9876543210");
        saved.setProductType("Awards");
        saved.setQuantity(25);
        saved.setMessage("Need branded awards for an event.");
        saved.setStatus("NEW");
        saved.setCreatedAt(LocalDateTime.now());
        when(service.create(request)).thenReturn(saved);

        ResponseEntity<ManufacturingQuoteSubmissionResponseDTO> response = controller.createQuote(request);

        assertEquals(201, response.getStatusCodeValue());
        assertNotNull(response.getBody());
        assertEquals(7L, response.getBody().getId());
        assertEquals("NEW", response.getBody().getStatus());
        assertNotNull(response.getBody().getCreatedAt());
        assertEquals(3, response.getBody().getClass().getDeclaredFields().length);
        verify(service).create(request);
    }

    @Test
    void adminListingMapsPersistedQuotesToResponses() {
        ManufacturingQuoteRequestService service = mock(ManufacturingQuoteRequestService.class);
        ManufacturingQuoteRequestController controller = new ManufacturingQuoteRequestController(service);
        ManufacturingQuoteRequest quote = new ManufacturingQuoteRequest();
        quote.setId(8L);
        quote.setName("Business");
        quote.setEmail("business@example.com");
        quote.setPhone("1234567890");
        quote.setProductType("Signage");
        quote.setQuantity(10);
        quote.setMessage("Need production signage for our event.");
        quote.setStatus("NEW");
        when(service.findLatest()).thenReturn(List.of(quote));

        ResponseEntity<List<ManufacturingQuoteResponseDTO>> response = controller.getAdminQuotes();

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(1, response.getBody().size());
        assertEquals("Signage", response.getBody().get(0).getProductType());
        verify(service).findLatest();
    }

    private ManufacturingQuoteRequestCreateDTO validRequest() {
        ManufacturingQuoteRequestCreateDTO request = new ManufacturingQuoteRequestCreateDTO();
        request.setName(" Buyer ");
        request.setEmail("buyer@example.com");
        request.setPhone("+91 9876543210");
        request.setProductType("Awards");
        request.setQuantity(25);
        request.setMessage("Need branded awards for an event.");
        return request;
    }
}

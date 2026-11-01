package com.example.woodyzbackend.controller;

import java.util.List;
import java.util.stream.Collectors;

import javax.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.woodyzbackend.dto.ManufacturingQuoteRequestCreateDTO;
import com.example.woodyzbackend.dto.ManufacturingQuoteResponseDTO;
import com.example.woodyzbackend.dto.ManufacturingQuoteSubmissionResponseDTO;
import com.example.woodyzbackend.service.ManufacturingQuoteRequestService;

@RestController
@RequestMapping("/api/manufacturing/quotes")
public class ManufacturingQuoteRequestController {

    private final ManufacturingQuoteRequestService service;

    public ManufacturingQuoteRequestController(ManufacturingQuoteRequestService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ManufacturingQuoteSubmissionResponseDTO> createQuote(
            @Valid @RequestBody ManufacturingQuoteRequestCreateDTO request) {
        ManufacturingQuoteSubmissionResponseDTO response = ManufacturingQuoteSubmissionResponseDTO
                .fromEntity(service.create(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/admin")
    public ResponseEntity<List<ManufacturingQuoteResponseDTO>> getAdminQuotes() {
        List<ManufacturingQuoteResponseDTO> response = service.findLatest().stream()
                .map(ManufacturingQuoteResponseDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}

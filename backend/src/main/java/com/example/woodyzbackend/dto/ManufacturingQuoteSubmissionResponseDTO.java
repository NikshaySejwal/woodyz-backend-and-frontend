package com.example.woodyzbackend.dto;

import java.time.LocalDateTime;

import com.example.woodyzbackend.entity.ManufacturingQuoteRequest;

public class ManufacturingQuoteSubmissionResponseDTO {

    private final Long id;
    private final String status;
    private final LocalDateTime createdAt;

    private ManufacturingQuoteSubmissionResponseDTO(Long id, String status, LocalDateTime createdAt) {
        this.id = id;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static ManufacturingQuoteSubmissionResponseDTO fromEntity(ManufacturingQuoteRequest entity) {
        return new ManufacturingQuoteSubmissionResponseDTO(entity.getId(), entity.getStatus(), entity.getCreatedAt());
    }

    public Long getId() {
        return id;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

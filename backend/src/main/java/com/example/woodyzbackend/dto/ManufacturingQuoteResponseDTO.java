package com.example.woodyzbackend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.example.woodyzbackend.entity.ManufacturingQuoteRequest;

public class ManufacturingQuoteResponseDTO {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String company;
    private String productType;
    private Integer quantity;
    private LocalDate requiredDeliveryDate;
    private String materialPreference;
    private String processPreference;
    private String message;
    private String status;
    private LocalDateTime createdAt;

    public static ManufacturingQuoteResponseDTO fromEntity(ManufacturingQuoteRequest entity) {
        ManufacturingQuoteResponseDTO response = new ManufacturingQuoteResponseDTO();
        response.id = entity.getId();
        response.name = entity.getName();
        response.email = entity.getEmail();
        response.phone = entity.getPhone();
        response.company = entity.getCompany();
        response.productType = entity.getProductType();
        response.quantity = entity.getQuantity();
        response.requiredDeliveryDate = entity.getRequiredDeliveryDate();
        response.materialPreference = entity.getMaterialPreference();
        response.processPreference = entity.getProcessPreference();
        response.message = entity.getMessage();
        response.status = entity.getStatus();
        response.createdAt = entity.getCreatedAt();
        return response;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getCompany() {
        return company;
    }

    public String getProductType() {
        return productType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public LocalDate getRequiredDeliveryDate() {
        return requiredDeliveryDate;
    }

    public String getMaterialPreference() {
        return materialPreference;
    }

    public String getProcessPreference() {
        return processPreference;
    }

    public String getMessage() {
        return message;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

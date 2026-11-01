package com.example.woodyzbackend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.woodyzbackend.dto.ManufacturingQuoteRequestCreateDTO;
import com.example.woodyzbackend.entity.ManufacturingQuoteRequest;
import com.example.woodyzbackend.repository.ManufacturingQuoteRequestRepository;

@Service
public class ManufacturingQuoteRequestService {

    private final ManufacturingQuoteRequestRepository repository;

    public ManufacturingQuoteRequestService(ManufacturingQuoteRequestRepository repository) {
        this.repository = repository;
    }

    public ManufacturingQuoteRequest create(ManufacturingQuoteRequestCreateDTO request) {
        ManufacturingQuoteRequest quote = new ManufacturingQuoteRequest();
        quote.setName(trim(request.getName()));
        quote.setEmail(trim(request.getEmail()));
        quote.setPhone(trim(request.getPhone()));
        quote.setCompany(trimNullable(request.getCompany()));
        quote.setProductType(trim(request.getProductType()));
        quote.setQuantity(request.getQuantity());
        quote.setRequiredDeliveryDate(request.getRequiredDeliveryDate());
        quote.setMaterialPreference(trimNullable(request.getMaterialPreference()));
        quote.setProcessPreference(trimNullable(request.getProcessPreference()));
        quote.setMessage(trim(request.getMessage()));
        quote.setStatus("NEW");
        return repository.save(quote);
    }

    public List<ManufacturingQuoteRequest> findLatest() {
        return new ArrayList<>(repository.findTop50ByOrderByCreatedAtDesc());
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String trimNullable(String value) {
        String trimmed = trim(value);
        return trimmed == null || trimmed.isEmpty() ? null : trimmed;
    }
}

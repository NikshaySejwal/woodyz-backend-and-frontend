package com.example.woodyzbackend.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.example.woodyzbackend.entity.ManufacturingQuoteRequest;

@Repository
public interface ManufacturingQuoteRequestRepository extends CrudRepository<ManufacturingQuoteRequest, Long> {
    java.util.List<ManufacturingQuoteRequest> findTop50ByOrderByCreatedAtDesc();
}

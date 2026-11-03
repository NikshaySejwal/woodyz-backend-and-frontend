package com.example.woodyzbackend.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.woodyzbackend.entity.AdminAuditEvent;

@Repository
public interface AdminAuditEventRepository extends JpaRepository<AdminAuditEvent, Long> {
    long deleteByCreatedAtBefore(LocalDateTime cutoff);
}

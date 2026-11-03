package com.example.woodyzbackend.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.woodyzbackend.entity.AdminAuditEvent;
import com.example.woodyzbackend.entity.User;
import com.example.woodyzbackend.repository.AdminAuditEventRepository;
import com.example.woodyzbackend.repository.UserRepository;

@Service
public class AdminAuditService {

    private final AdminAuditEventRepository auditRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final int retentionDays;
    private final boolean rlsEnabled;

    public AdminAuditService(AdminAuditEventRepository auditRepository, UserRepository userRepository,
            JdbcTemplate jdbcTemplate, @Value("${app.audit.retention-days:365}") int retentionDays,
            @Value("${app.rls.enabled:false}") boolean rlsEnabled) {
        this.auditRepository = auditRepository;
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.retentionDays = retentionDays;
        this.rlsEnabled = rlsEnabled;
    }

    public void record(String username, String action, String resourceType, Long resourceId, int statusCode) {
        User actor = userRepository.findByUsername(username);
        if (actor == null || actor.getId() == null) {
            throw new IllegalStateException("Cannot record an admin action without a persisted actor");
        }
        AdminAuditEvent event = new AdminAuditEvent();
        event.setActorUserId(actor.getId());
        event.setAction(action);
        event.setResourceType(resourceType);
        event.setResourceId(resourceId);
        event.setStatusCode(statusCode);
        auditRepository.save(event);
    }

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void removeExpiredEvents() {
        if (rlsEnabled) {
            jdbcTemplate.queryForObject("SELECT set_config(?, ?, true)", String.class,
                    "app.retention_job", "true");
        }
        auditRepository.deleteByCreatedAtBefore(LocalDateTime.now().minusDays(retentionDays));
    }
}

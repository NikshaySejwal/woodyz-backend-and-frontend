package com.example.woodyzbackend.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class PostgresRlsInitializerTest {

    @Test
    void enablesForcedRlsAndInstallsPoliciesForApplicationTables() {
        RecordingJdbcTemplate jdbcTemplate = new RecordingJdbcTemplate();
        PostgresRlsInitializer initializer = new PostgresRlsInitializer(jdbcTemplate);

        initializer.run(null);

        assertTrue(jdbcTemplate.statements.stream().anyMatch(sql -> sql.equals("ALTER TABLE orders ENABLE ROW LEVEL SECURITY")));
        assertTrue(jdbcTemplate.statements.stream().anyMatch(sql -> sql.equals("ALTER TABLE orders FORCE ROW LEVEL SECURITY")));
        assertTrue(jdbcTemplate.statements.stream().anyMatch(sql -> sql.contains("woodyz_orders_read")));
        assertTrue(jdbcTemplate.statements.stream().anyMatch(sql -> sql.contains("woodyz_support_insert")));
        assertTrue(jdbcTemplate.statements.stream().anyMatch(sql -> sql.contains("woodyz_audit_insert")));
    }

    private static final class RecordingJdbcTemplate extends JdbcTemplate {
        private final List<String> statements = new ArrayList<>();

        @Override
        public <T> T queryForObject(String sql, Class<T> requiredType) {
            return requiredType.cast(Boolean.FALSE);
        }

        @Override
        public <T> T queryForObject(String sql, Class<T> requiredType, Object... args) {
            return requiredType.cast(!sql.contains("pg_policies"));
        }

        @Override
        public void execute(String sql) {
            statements.add(sql);
        }
    }
}

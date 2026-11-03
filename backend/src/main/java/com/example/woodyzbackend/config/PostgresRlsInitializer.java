package com.example.woodyzbackend.config;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "app.rls.enabled", havingValue = "true")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PostgresRlsInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public PostgresRlsInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        Boolean bypassesRls = jdbcTemplate.queryForObject(
                "SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user",
                Boolean.class);
        if (Boolean.TRUE.equals(bypassesRls)) {
            throw new IllegalStateException("PostgreSQL RLS requires a non-superuser application role without BYPASSRLS");
        }

        List<String> tables = List.of("users", "orders", "order_status_history", "support_tickets",
                "reviews", "products", "manufacturing_quote_requests", "coupons",
                "stripe_webhook_events", "admin_audit_log");
        String tablePlaceholders = tables.stream().map(table -> "?").collect(Collectors.joining(","));
        Boolean hasUnreviewedPolicies = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() "
                        + "AND tablename IN (" + tablePlaceholders + ") AND policyname NOT LIKE 'woodyz_%')",
                Boolean.class, tables.toArray());
        if (Boolean.TRUE.equals(hasUnreviewedPolicies)) {
            throw new IllegalStateException("RLS tables contain policies outside the reviewed woodyz policy set");
        }

        for (String table : tables) {
            Boolean exists = jdbcTemplate.queryForObject("SELECT to_regclass(?) IS NOT NULL", Boolean.class, table);
            if (!Boolean.TRUE.equals(exists)) {
                throw new IllegalStateException("RLS requires the application table to exist: " + table);
            }
            jdbcTemplate.execute("ALTER TABLE " + table + " ENABLE ROW LEVEL SECURITY");
            jdbcTemplate.execute("ALTER TABLE " + table + " FORCE ROW LEVEL SECURITY");
        }

        List<String> policies = List.of(
                policy("users", "woodyz_users_read", "SELECT",
                        "current_setting('app.is_admin', true) = 'true' OR current_setting('app.auth_lookup', true) = 'true' OR username = current_setting('app.username', true)", null),
                policy("users", "woodyz_users_insert", "INSERT", null,
                        "current_setting('app.is_admin', true) = 'true' OR (current_setting('app.auth_lookup', true) = 'true' AND role = 'USER')"),
                policy("users", "woodyz_users_update", "UPDATE",
                        "current_setting('app.is_admin', true) = 'true' OR username = current_setting('app.username', true)",
                        "current_setting('app.is_admin', true) = 'true' OR (username = current_setting('app.username', true) AND role = 'USER')"),
                policy("users", "woodyz_users_delete", "DELETE",
                        "current_setting('app.is_admin', true) = 'true'", null),
                policy("orders", "woodyz_orders_read", "SELECT", "current_setting('app.is_admin', true) = 'true' OR user_id = NULLIF(current_setting('app.user_id', true), '')::bigint", null),
                policy("orders", "woodyz_orders_insert", "INSERT", null,
                        "current_setting('app.is_admin', true) = 'true' OR user_id = NULLIF(current_setting('app.user_id', true), '')::bigint"),
                policy("orders", "woodyz_orders_update", "UPDATE",
                        "current_setting('app.is_admin', true) = 'true' OR user_id = NULLIF(current_setting('app.user_id', true), '')::bigint",
                        "current_setting('app.is_admin', true) = 'true' OR user_id = NULLIF(current_setting('app.user_id', true), '')::bigint"),
                policy("orders", "woodyz_orders_delete", "DELETE", "current_setting('app.is_admin', true) = 'true'", null),
                policy("order_status_history", "woodyz_history_read", "SELECT",
                        "current_setting('app.is_admin', true) = 'true' OR EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = NULLIF(current_setting('app.user_id', true), '')::bigint)", null),
                policy("order_status_history", "woodyz_history_insert", "INSERT", null,
                        "current_setting('app.is_admin', true) = 'true' OR EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = NULLIF(current_setting('app.user_id', true), '')::bigint)"),
                policy("order_status_history", "woodyz_history_update", "UPDATE",
                        "current_setting('app.is_admin', true) = 'true'",
                        "current_setting('app.is_admin', true) = 'true'"),
                policy("order_status_history", "woodyz_history_delete", "DELETE", "current_setting('app.is_admin', true) = 'true'", null),
                policy("support_tickets", "woodyz_support_read", "SELECT",
                        "current_setting('app.is_admin', true) = 'true' OR user_id = NULLIF(current_setting('app.user_id', true), '')::bigint", null),
                policy("support_tickets", "woodyz_support_insert", "INSERT", null,
                        "current_setting('app.is_admin', true) = 'true' OR user_id = NULLIF(current_setting('app.user_id', true), '')::bigint OR (user_id IS NULL AND COALESCE(current_setting('app.username', true), '') = '')"),
                policy("support_tickets", "woodyz_support_update", "UPDATE",
                        "current_setting('app.is_admin', true) = 'true'",
                        "current_setting('app.is_admin', true) = 'true'"),
                policy("support_tickets", "woodyz_support_delete", "DELETE", "current_setting('app.is_admin', true) = 'true'", null),
                policy("reviews", "woodyz_reviews_read", "SELECT", "true", null),
                policy("reviews", "woodyz_reviews_insert", "INSERT", null,
                        "current_setting('app.is_admin', true) = 'true' OR user_id = NULLIF(current_setting('app.user_id', true), '')::bigint"),
                policy("reviews", "woodyz_reviews_update", "UPDATE",
                        "current_setting('app.is_admin', true) = 'true' OR user_id = NULLIF(current_setting('app.user_id', true), '')::bigint",
                        "current_setting('app.is_admin', true) = 'true' OR user_id = NULLIF(current_setting('app.user_id', true), '')::bigint"),
                policy("reviews", "woodyz_reviews_delete", "DELETE", "current_setting('app.is_admin', true) = 'true'", null),
                policy("products", "woodyz_products_read", "SELECT", "true", null),
                policy("products", "woodyz_products_insert", "INSERT", null, "current_setting('app.is_admin', true) = 'true'"),
                policy("products", "woodyz_products_update", "UPDATE", "current_setting('app.is_admin', true) = 'true'", "current_setting('app.is_admin', true) = 'true'"),
                policy("products", "woodyz_products_delete", "DELETE", "current_setting('app.is_admin', true) = 'true'", null),
                policy("manufacturing_quote_requests", "woodyz_quotes_read", "SELECT", "current_setting('app.is_admin', true) = 'true'", null),
                policy("manufacturing_quote_requests", "woodyz_quotes_insert", "INSERT", null, "true"),
                policy("manufacturing_quote_requests", "woodyz_quotes_update", "UPDATE", "current_setting('app.is_admin', true) = 'true'", "current_setting('app.is_admin', true) = 'true'"),
                policy("manufacturing_quote_requests", "woodyz_quotes_delete", "DELETE", "current_setting('app.is_admin', true) = 'true'", null),
                policy("coupons", "woodyz_coupons_admin", "ALL", "current_setting('app.is_admin', true) = 'true'", "current_setting('app.is_admin', true) = 'true'"),
                policy("stripe_webhook_events", "woodyz_webhook_events_read", "SELECT", "true", null),
                policy("stripe_webhook_events", "woodyz_webhook_events_insert", "INSERT", null, "true"),
                policy("stripe_webhook_events", "woodyz_webhook_events_update", "UPDATE",
                        "current_setting('app.is_admin', true) = 'true'",
                        "current_setting('app.is_admin', true) = 'true'"),
                policy("stripe_webhook_events", "woodyz_webhook_events_delete", "DELETE",
                        "current_setting('app.is_admin', true) = 'true'", null),
                policy("admin_audit_log", "woodyz_audit_read", "SELECT", "current_setting('app.is_admin', true) = 'true'", null),
                policy("admin_audit_log", "woodyz_audit_insert", "INSERT", null,
                        "current_setting('app.is_admin', true) = 'true' AND actor_user_id = NULLIF(current_setting('app.user_id', true), '')::bigint"),
                policy("admin_audit_log", "woodyz_audit_delete", "DELETE",
                        "current_setting('app.is_admin', true) = 'true' OR current_setting('app.retention_job', true) = 'true'", null));

        for (String policy : policies) {
            jdbcTemplate.execute(policy);
        }
    }

    private String policy(String table, String name, String command, String using, String check) {
        StringBuilder create = new StringBuilder("CREATE POLICY ").append(name).append(" ON ").append(table)
                .append(" FOR ").append(command);
        if (using != null) {
            create.append(" USING (").append(using).append(")");
        }
        if (check != null) {
            create.append(" WITH CHECK (").append(check).append(")");
        }
        return "DO $rls$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() "
                + "AND tablename = '" + table + "' AND policyname = '" + name + "') THEN "
                + create + "; END IF; END $rls$";
    }
}

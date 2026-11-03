package com.example.woodyzbackend.security;

import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.woodyzbackend.entity.User;
import com.example.woodyzbackend.repository.UserRepository;

@Service
public class PostgresRlsContext {

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final TransactionTemplate transactionTemplate;
    private final boolean enabled;

    public PostgresRlsContext(JdbcTemplate jdbcTemplate, UserRepository userRepository,
            PlatformTransactionManager transactionManager,
            @Value("${app.rls.enabled:false}") boolean enabled) {
        this.jdbcTemplate = jdbcTemplate;
        this.userRepository = userRepository;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.enabled = enabled;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void executeAsAdmin(Runnable action) {
        if (!enabled) {
            action.run();
            return;
        }
        transactionTemplate.executeWithoutResult(status -> {
            setContext("app.username", "");
            setContext("app.user_id", "");
            setContext("app.is_admin", "true");
            setContext("app.auth_lookup", "false");
            setContext("app.retention_job", "false");
            action.run();
        });
    }

    public void filter(String username, HttpServletRequest request, HttpServletResponse response,
            FilterChain chain, UserDetailsService userDetailsService) throws IOException, ServletException {
        try {
            transactionTemplate.executeWithoutResult(status -> {
                try {
                    boolean authLookup = username == null && "POST".equalsIgnoreCase(request.getMethod())
                            && ("/api/auth/login".equals(request.getRequestURI())
                                    || "/api/auth/signup".equals(request.getRequestURI()));
                    setContext("app.username", username == null ? "" : username);
                    setContext("app.user_id", "");
                    setContext("app.is_admin", "false");
                    setContext("app.auth_lookup", Boolean.toString(authLookup));
                    setContext("app.retention_job", "false");

                    if (username != null) {
                        UserDetails details = userDetailsService.loadUserByUsername(username);
                        User user = userRepository.findByUsername(username);
                        if (user == null) {
                            throw new IllegalStateException("Authenticated account could not be resolved");
                        }
                        if (details.isEnabled()) {
                            boolean admin = details.getAuthorities().stream()
                                    .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
                            setContext("app.user_id", user.getId().toString());
                            setContext("app.is_admin", Boolean.toString(admin));
                            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                    details, null, details.getAuthorities());
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    }
                    chain.doFilter(request, response);
                } catch (IOException | ServletException exception) {
                    status.setRollbackOnly();
                    throw new FilterExecutionException(exception);
                }
            });
        } catch (FilterExecutionException exception) {
            if (exception.getCause() instanceof IOException) {
                throw (IOException) exception.getCause();
            }
            throw (ServletException) exception.getCause();
        }
    }

    private void setContext(String name, String value) {
        jdbcTemplate.queryForObject("SELECT set_config(?, ?, true)", String.class, name, value);
    }

    private static final class FilterExecutionException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        private FilterExecutionException(Exception cause) {
            super(cause);
        }
    }
}

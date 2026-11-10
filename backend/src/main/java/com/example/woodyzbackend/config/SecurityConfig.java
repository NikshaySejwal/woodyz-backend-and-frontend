package com.example.woodyzbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;

import com.example.woodyzbackend.security.JwtAuthenticationFilter;
import com.example.woodyzbackend.security.AdminAuditFilter;
import com.example.woodyzbackend.security.RateLimitFilter;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
            @Value("${app.security.require-https:true}") boolean requireHttps,
            RateLimitFilter rateLimitFilter, AdminAuditFilter adminAuditFilter) throws Exception {
        http.cors().and().csrf().disable()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
                .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts
                .includeSubDomains(true)
                .preload(true)
                .maxAgeInSeconds(31536000))
                .frameOptions(frameOptions -> frameOptions.deny())
                .contentTypeOptions()
                .and()
                .addHeaderWriter(new org.springframework.security.web.header.writers.StaticHeadersWriter(
                        "Permissions-Policy", "camera=(), microphone=(), geolocation=()"))
                .referrerPolicy(referrer -> referrer.policy(
                        org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"))
                )
                .authorizeRequests()
                .antMatchers("/api/auth/**").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/user/profile", "/api/users/profile").authenticated()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/products/admin").hasRole("ADMIN")
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/products/**").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/uploads/**").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/reviews/product/**").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.POST, "/api/reviews/**").authenticated()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/reviews/user").authenticated()
                .antMatchers(org.springframework.http.HttpMethod.POST, "/api/support", "/api/support/").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.POST, "/api/manufacturing/quotes").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/manufacturing/quotes/admin").hasRole("ADMIN")
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/support/user").authenticated()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/support", "/api/support/").hasRole("ADMIN")
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/support/{id}").authenticated()
                .antMatchers(org.springframework.http.HttpMethod.PUT, "/api/support/**").hasRole("ADMIN")
                .antMatchers(org.springframework.http.HttpMethod.POST, "/api/support/*/message").hasRole("ADMIN")
                .antMatchers(org.springframework.http.HttpMethod.POST, "/api/products/**").hasRole("ADMIN")
                .antMatchers(org.springframework.http.HttpMethod.PUT, "/api/products/**").hasRole("ADMIN")
                .antMatchers(org.springframework.http.HttpMethod.DELETE, "/api/products/**").hasRole("ADMIN")
                .antMatchers("/api/analytics/**").hasRole("ADMIN")
                .antMatchers("/api/coupons/**").hasRole("ADMIN")
                .antMatchers("/api/config/**").hasRole("ADMIN")
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/orders").hasRole("ADMIN")
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/orders/{id}").authenticated()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/orders/user/**").authenticated()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/orders/{id}/history").authenticated()
                .antMatchers(org.springframework.http.HttpMethod.POST, "/api/orders/**").authenticated()
                .antMatchers(org.springframework.http.HttpMethod.POST, "/api/payments/webhook").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.POST, "/api/payments/demo-intent").authenticated()
                .antMatchers("/api/payments/**").authenticated()
                .anyRequest().authenticated();

        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        http.addFilterAfter(rateLimitFilter, JwtAuthenticationFilter.class);
        http.addFilterAfter(adminAuditFilter, RateLimitFilter.class);
        if (requireHttps) {
            http.requiresChannel().anyRequest().requiresSecure();
        }

        return http.build();
    }

    @Bean
    public RateLimitFilter rateLimitFilter(org.springframework.data.redis.core.StringRedisTemplate redisTemplate,
            @Value("${app.rate-limit.enabled:true}") boolean enabled) {
        return new RateLimitFilter(redisTemplate, enabled);
    }

    @Bean
    public AdminAuditFilter adminAuditFilter(com.example.woodyzbackend.service.AdminAuditService auditService) {
        return new AdminAuditFilter(auditService);
    }

    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration(
            JwtAuthenticationFilter filter) {
        return disabledServletRegistration(filter);
    }

    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(RateLimitFilter filter) {
        return disabledServletRegistration(filter);
    }

    @Bean
    public FilterRegistrationBean<AdminAuditFilter> adminAuditFilterRegistration(AdminAuditFilter filter) {
        return disabledServletRegistration(filter);
    }

    private <T extends javax.servlet.Filter> FilterRegistrationBean<T> disabledServletRegistration(T filter) {
        FilterRegistrationBean<T> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}

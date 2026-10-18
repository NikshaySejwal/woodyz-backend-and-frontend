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

import com.example.woodyzbackend.security.JwtAuthenticationFilter;

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
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors().and().csrf().disable()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
                .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts
                .includeSubDomains(true)
                .preload(true)
                .maxAgeInSeconds(31536000))
                .frameOptions(frameOptions -> frameOptions.deny())
                )
                .authorizeRequests()
                .antMatchers("/api/auth/**").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/user/profile", "/api/users/profile").authenticated()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/products/**").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/uploads/**").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/reviews/product/**").permitAll()
                .antMatchers(org.springframework.http.HttpMethod.POST, "/api/reviews/**").authenticated()
                .antMatchers(org.springframework.http.HttpMethod.GET, "/api/reviews/user").authenticated()
                .antMatchers(org.springframework.http.HttpMethod.POST, "/api/support", "/api/support/").permitAll()
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
                .antMatchers("/api/payments/**").authenticated()
                .anyRequest().authenticated();

        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

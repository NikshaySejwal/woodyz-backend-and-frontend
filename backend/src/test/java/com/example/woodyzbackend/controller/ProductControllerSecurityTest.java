package com.example.woodyzbackend.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.example.woodyzbackend.config.SecurityConfig;
import com.example.woodyzbackend.entity.Product;
import com.example.woodyzbackend.security.JwtTokenProvider;
import com.example.woodyzbackend.security.PostgresRlsContext;
import com.example.woodyzbackend.service.ProductImageStorageService;
import com.example.woodyzbackend.service.ProductService;

@WebMvcTest(ProductController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {"app.security.require-https=false", "app.rate-limit.enabled=false"})
class ProductControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @MockBean
    @SuppressWarnings("unused")
    private ProductImageStorageService productImageStorageService;

    @MockBean
    @SuppressWarnings("unused")
    private PostgresRlsContext rlsContext;

    @MockBean
    @SuppressWarnings("unused")
    private org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    @MockBean
    @SuppressWarnings("unused")
    private com.example.woodyzbackend.service.AdminAuditService adminAuditService;

    @MockBean
    @SuppressWarnings("unused")
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    @SuppressWarnings("unused")
    private org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    @Test
    void onlyAdminsCanListDraftProducts() throws Exception {
        mockMvc.perform(get("/api/products/admin"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/products/admin").with(user("customer").roles("USER")))
                .andExpect(status().isForbidden());

        verifyNoInteractions(productService);
    }

    @Test
    void adminsCanListDraftProducts() throws Exception {
        Product draft = new Product();
        draft.setName("Draft product");
        draft.setPublished(Boolean.FALSE);
        when(productService.getAllProducts()).thenReturn(List.of(draft));

        mockMvc.perform(get("/api/products/admin").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Draft product"))
                .andExpect(jsonPath("$[0].published").value(false));

        verify(productService).getAllProducts();
    }
}

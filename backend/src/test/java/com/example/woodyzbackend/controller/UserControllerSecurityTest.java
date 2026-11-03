package com.example.woodyzbackend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import com.example.woodyzbackend.config.SecurityConfig;
import com.example.woodyzbackend.entity.User;
import com.example.woodyzbackend.security.JwtTokenProvider;
import com.example.woodyzbackend.service.UserService;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
@SuppressWarnings("null")
class UserControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    @SuppressWarnings("unused")
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    @SuppressWarnings("unused")
    private UserDetailsService userDetailsService;

    @Test
    void regularUserCannotCreateOrPromoteAnAccount() throws Exception {
        mockMvc.perform(post("/api/users/")
                .with(user("customer").roles("USER"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"id\":7,\"username\":\"customer\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(userService);
    }

    @Test
    void adminCanCreateAnAccount() throws Exception {
        User saved = new User();
        saved.setUsername("new-customer");
        saved.setRole("USER");
        when(userService.saveUser(any(User.class))).thenReturn(saved);

        mockMvc.perform(post("/api/users/")
                .with(user("admin").roles("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"new-customer\",\"role\":\"USER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("new-customer"))
                .andExpect(jsonPath("$.role").value("USER"));

        verify(userService).saveUser(any(User.class));
    }
}

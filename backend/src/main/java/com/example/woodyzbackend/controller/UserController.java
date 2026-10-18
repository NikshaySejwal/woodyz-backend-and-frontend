package com.example.woodyzbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.woodyzbackend.entity.User;
import com.example.woodyzbackend.service.UserService;

/**
 * REST controller for managing user accounts. Provides endpoints for retrieving
 * user details by username and creating new users.
 *
 * Connections: - Integrates with `UserService` for user-related business logic
 * and persistence. - Exposed via `/api/users/**`.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * Retrieves a user by their username.
     *
     * @param username The username to look up.
     * @return The requested `User` entity.
     */
    @GetMapping("/{username}")
    public ResponseEntity<com.example.woodyzbackend.dto.UserProfileDTO> getUserByUsername(@PathVariable String username, Authentication authentication) {
        if (authentication == null || (!authentication.getName().equals(username) && authentication.getAuthorities().stream()
                .noneMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority())))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        User user = userService.findByUsername(username);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        com.example.woodyzbackend.dto.UserProfileDTO dto = new com.example.woodyzbackend.dto.UserProfileDTO(
                user.getUsername(), user.getEmail(), user.getRole(), user.getAddress(), user.getPhone(), user.isBlacklisted());
        return ResponseEntity.ok(dto);
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{username}")
    public ResponseEntity<Void> blacklistUser(@PathVariable String username, Authentication authentication) {
        boolean admin = authentication != null && authentication.getAuthorities().stream()
                .map(a -> a.getAuthority()).anyMatch("ROLE_ADMIN"::equals);
        if (!admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        User user = userService.findByUsername(username);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        user.setBlacklisted(true);
        userService.saveUser(user);
        return ResponseEntity.noContent().build();
    }

    @org.springframework.web.bind.annotation.PutMapping("/{username}/blacklist")
    public ResponseEntity<Void> updateBlacklist(@PathVariable String username, @RequestBody java.util.Map<String, Boolean> body,
            Authentication authentication) {
        boolean admin = authentication != null && authentication.getAuthorities().stream()
                .map(a -> a.getAuthority()).anyMatch("ROLE_ADMIN"::equals);
        if (!admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        User user = userService.findByUsername(username);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        if (body.get("blacklisted") == null) {
            return ResponseEntity.badRequest().build();
        }
        user.setBlacklisted(body.get("blacklisted"));
        userService.saveUser(user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profile")
    public org.springframework.http.ResponseEntity<com.example.woodyzbackend.dto.UserProfileDTO> getProfile() {
        User currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return org.springframework.http.ResponseEntity.status(401).build();
        }
        com.example.woodyzbackend.dto.UserProfileDTO dto = new com.example.woodyzbackend.dto.UserProfileDTO(
                currentUser.getUsername(), currentUser.getEmail(), currentUser.getRole(),
                currentUser.getAddress(), currentUser.getPhone(), currentUser.isBlacklisted());
        return org.springframework.http.ResponseEntity.ok(dto);
    }

    /**
     * Creates a new user in the system.
     *
     * @param user The user details to save.
     * @return The created `User` entity.
     */
    @PostMapping("/")
    public User createUser(@RequestBody User user) {
        return userService.saveUser(user);
    }
}

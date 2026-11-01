package com.example.woodyzbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.woodyzbackend.dto.UserProfileDTO;
import com.example.woodyzbackend.entity.User;
import com.example.woodyzbackend.service.UserService;

@RestController
@RequestMapping("/api/user")
public class UserProfileController {

    @Autowired
    private UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> getUserProfile() {
        User currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        UserProfileDTO userProfileDTO = toDto(currentUser);
        return ResponseEntity.ok(userProfileDTO);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileDTO> updateUserProfile(@RequestBody UserProfileDTO profile) {
        User currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        currentUser.setAddress(profile.getAddress());
        currentUser.setPhone(profile.getPhone());
        return ResponseEntity.ok(toDto(userService.saveUser(currentUser)));
    }

    private UserProfileDTO toDto(User user) {
        UserProfileDTO profile = new UserProfileDTO(user.getUsername(), user.getEmail(), user.getRole(), user.getAddress(), user.getPhone(), user.isBlacklisted());
        profile.setId(user.getId());
        return profile;
    }
}

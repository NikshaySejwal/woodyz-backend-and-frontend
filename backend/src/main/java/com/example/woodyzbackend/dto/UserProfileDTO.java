package com.example.woodyzbackend.dto;

public class UserProfileDTO {

    private Long id;
    private String username;
    private String email;
    private String role;
    private String address;
    private String phone;
    private boolean blacklisted;

    public UserProfileDTO(String username, String email, String role, String address, String phone, boolean blacklisted) {
        this.username = username;
        this.email = email;
        this.role = role;
        this.address = address;
        this.phone = phone;
        this.blacklisted = blacklisted;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public boolean isBlacklisted() {
        return blacklisted;
    }

    public void setBlacklisted(boolean blacklisted) {
        this.blacklisted = blacklisted;
    }
}

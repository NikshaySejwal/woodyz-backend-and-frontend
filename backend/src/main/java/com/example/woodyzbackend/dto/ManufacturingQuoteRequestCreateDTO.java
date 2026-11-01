package com.example.woodyzbackend.dto;

import java.time.LocalDate;

import javax.validation.constraints.Email;
import javax.validation.constraints.FutureOrPresent;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

public class ManufacturingQuoteRequestCreateDTO {

    @NotBlank
    @Size(max = 120)
    private String name;

    @NotBlank
    @Email
    @Size(max = 254)
    private String email;

    @NotBlank
    @Pattern(regexp = "^[0-9+() .-]{7,30}$", message = "phone must contain valid phone characters")
    private String phone;

    @Size(max = 160)
    private String company;

    @NotBlank
    @Size(max = 120)
    private String productType;

    @NotNull
    @Min(1)
    @Max(1000000)
    private Integer quantity;

    @FutureOrPresent
    private LocalDate requiredDeliveryDate;

    @Size(max = 120)
    private String materialPreference;

    @Size(max = 120)
    private String processPreference;

    @NotBlank
    @Size(min = 10, max = 5000)
    private String message;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = trim(name);
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = trim(email);
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = trim(phone);
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = trim(company);
    }

    public String getProductType() {
        return productType;
    }

    public void setProductType(String productType) {
        this.productType = trim(productType);
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public LocalDate getRequiredDeliveryDate() {
        return requiredDeliveryDate;
    }

    public void setRequiredDeliveryDate(LocalDate requiredDeliveryDate) {
        this.requiredDeliveryDate = requiredDeliveryDate;
    }

    public String getMaterialPreference() {
        return materialPreference;
    }

    public void setMaterialPreference(String materialPreference) {
        this.materialPreference = trim(materialPreference);
    }

    public String getProcessPreference() {
        return processPreference;
    }

    public void setProcessPreference(String processPreference) {
        this.processPreference = trim(processPreference);
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = trim(message);
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}

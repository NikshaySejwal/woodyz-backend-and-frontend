package com.example.woodyzbackend.dto;

import java.util.List;

public class DemoPaymentIntentRequest {

    private List<CheckoutItemRequest> items;
    private String method;

    public List<CheckoutItemRequest> getItems() {
        return items;
    }

    public void setItems(List<CheckoutItemRequest> items) {
        this.items = items;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }
}

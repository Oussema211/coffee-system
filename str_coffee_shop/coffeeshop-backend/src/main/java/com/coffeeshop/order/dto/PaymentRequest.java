package com.coffeeshop.order.dto;

import lombok.Data;

import java.util.List;

@Data
public class PaymentRequest {
    private String paymentType; // "full" or "split"
    private List<PaymentItemRequest> items; // quantities selected for a split payment
}

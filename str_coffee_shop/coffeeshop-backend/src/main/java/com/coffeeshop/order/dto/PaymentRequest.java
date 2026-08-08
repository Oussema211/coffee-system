package com.coffeeshop.order.dto;

import lombok.Data;

import java.util.List;

@Data
public class PaymentRequest {
    private String paymentType; // "full" or "split"
    private List<Long> itemIds; // for split payment
}

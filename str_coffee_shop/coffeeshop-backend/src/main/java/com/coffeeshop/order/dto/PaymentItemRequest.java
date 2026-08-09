package com.coffeeshop.order.dto;

import lombok.Data;

@Data
public class PaymentItemRequest {
    private Long itemId;
    private Integer quantity;
}

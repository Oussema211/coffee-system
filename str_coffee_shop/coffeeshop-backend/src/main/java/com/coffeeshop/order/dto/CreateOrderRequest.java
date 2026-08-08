package com.coffeeshop.order.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {
    @NotNull(message = "Order type is required")
    private String orderType;

    private Integer tableNumber;

    @NotEmpty(message = "Cart cannot be empty")
    private List<CreateOrderItemRequest> items;
}

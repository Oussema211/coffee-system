package com.coffeeshop.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateOrderItemRequest {
    @NotNull(message = "Menu item ID is required")
    private Long menuItemId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private String size;
    private String sugar;
    private Integer extraShots;
}

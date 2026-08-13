package com.coffeeshop.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemDTO {
    private Long id;
    private Long menuItemId;
    private String name;
    private BigDecimal price;
    private BigDecimal vatRate;
    private Integer qty;
    private boolean paid;
    private boolean selected;
    private String size;
    private String sugar;
    private Integer extraShots;
}

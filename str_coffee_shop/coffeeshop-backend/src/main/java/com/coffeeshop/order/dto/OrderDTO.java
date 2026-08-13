package com.coffeeshop.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDTO {
    private Long id;
    private Integer table;
    private String type;
    private List<String> items;
    private List<OrderItemDTO> orderItems;
    private BigDecimal total;
    private String time;
    private String workerName;
    private Long workerId;
    private String status;
}

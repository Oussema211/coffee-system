package com.coffeeshop.table.dto;

import com.coffeeshop.order.dto.OrderItemDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableDTO {
    private Long id;
    private int number;
    private int seats;
    private String status;
    private Long activeOrderId;
    private String since;
    private List<OrderItemDTO> orderItems;
}


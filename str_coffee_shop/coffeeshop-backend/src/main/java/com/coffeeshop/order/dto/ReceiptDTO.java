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
public class ReceiptDTO {
    private String shopName;
    private String receiptNumber;
    private Long orderId;
    private Integer tableNumber;
    private String orderType;
    private String orderTime;
    private String printedAt;
    private String workerName;
    private String status;
    private List<OrderItemDTO> items;
    private BigDecimal total;
}

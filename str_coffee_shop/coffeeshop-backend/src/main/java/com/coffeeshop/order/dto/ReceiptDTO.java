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
    private String shopMatricule;
    private String shopAddress;
    private String shopPhone;
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
    private BigDecimal totalExclVat;
    private BigDecimal totalVat;
    private List<VatBreakdownDTO> vatBreakdown;
}

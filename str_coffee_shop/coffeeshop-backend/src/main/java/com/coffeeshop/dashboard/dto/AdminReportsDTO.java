package com.coffeeshop.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminReportsDTO(
        BigDecimal weekTotal,
        BigDecimal averageOrderValue,
        String bestSeller,
        List<DailySales> weekSales,
        List<TopItem> topItems
) {
    public record DailySales(String day, BigDecimal amount) {}
    public record TopItem(String name, long sold) {}
}

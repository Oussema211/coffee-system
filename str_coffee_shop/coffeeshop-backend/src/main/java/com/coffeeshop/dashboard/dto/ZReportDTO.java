package com.coffeeshop.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * End-of-day fiscal summary (Z-report): daily totals including a TVA breakdown.
 */
public record ZReportDTO(
        String date,
        long orderCount,
        BigDecimal revenue,
        BigDecimal revenueExclVat,
        BigDecimal totalVat,
        List<VatLine> vatBreakdown
) {
    public record VatLine(BigDecimal rate, BigDecimal base, BigDecimal vat, BigDecimal total) {}
}

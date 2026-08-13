package com.coffeeshop.order.dto;

import java.math.BigDecimal;

/**
 * One line of a TVA (VAT) breakdown: base amount excluding VAT, the VAT
 * amount and the total including VAT, all grouped by a single rate.
 */
public record VatBreakdownDTO(
        BigDecimal rate,
        BigDecimal base,
        BigDecimal vat,
        BigDecimal total
) {}

package com.coffeeshop.util;

import com.coffeeshop.order.dto.VatBreakdownDTO;
import com.coffeeshop.order.entity.OrderItem;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Shared TVA (VAT) calculation helpers. Prices in the system are stored
 * tax-inclusive (as displayed to customers); the VAT amount is extracted
 * from the inclusive price using {@code vat = incl - incl * 100 / (100 + rate)}.
 */
public final class VatUtils {

    public static final BigDecimal DEFAULT_RATE = new BigDecimal("19.00");
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private VatUtils() {
    }

    public static BigDecimal effectiveRate(BigDecimal rate) {
        return (rate != null && rate.signum() > 0) ? rate : DEFAULT_RATE;
    }

    public static BigDecimal vatAmount(BigDecimal priceIncl, BigDecimal rate) {
        if (priceIncl == null || priceIncl.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal effective = effectiveRate(rate);
        BigDecimal base = priceIncl.multiply(HUNDRED)
                .divide(HUNDRED.add(effective), 4, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);
        return priceIncl.subtract(base);
    }

    public static BigDecimal baseAmount(BigDecimal priceIncl, BigDecimal rate) {
        return priceIncl.subtract(vatAmount(priceIncl, rate));
    }

    /**
     * Groups order items by VAT rate and produces the receipt breakdown lines.
     */
    public static List<VatBreakdownDTO> buildBreakdown(List<OrderItem> items) {
        Map<BigDecimal, BigDecimal> inclusiveByRate = new LinkedHashMap<>();
        for (OrderItem item : items) {
            BigDecimal rate = effectiveRate(item.getVatRate());
            BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            inclusiveByRate.merge(rate, lineTotal, BigDecimal::add);
        }

        List<VatBreakdownDTO> breakdown = new ArrayList<>();
        for (Map.Entry<BigDecimal, BigDecimal> entry : inclusiveByRate.entrySet()) {
            BigDecimal inclusive = entry.getValue();
            BigDecimal base = inclusive.multiply(HUNDRED)
                    .divide(HUNDRED.add(entry.getKey()), 4, RoundingMode.HALF_UP)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal vat = inclusive.subtract(base);
            breakdown.add(new VatBreakdownDTO(entry.getKey(), base, vat, inclusive));
        }
        return breakdown;
    }
}

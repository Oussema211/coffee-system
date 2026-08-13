package com.coffeeshop.menu.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SizeOptionDTO {
    @NotBlank(message = "Size name is required")
    private String name;

    @DecimalMin(value = "0", message = "Size price delta must be 0 or positive")
    private BigDecimal priceDelta;
}

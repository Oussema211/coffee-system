package com.coffeeshop.menu.dto;

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
public class MenuItemDTO {
    private Long id;
    private String name;
    private String category;
    private Long categoryId;
    private BigDecimal price;
    private BigDecimal vatRate;
    private boolean available;
    private String imageUrl;
    private boolean hasSizes;
    private boolean hasSugar;
    private List<SizeOptionDTO> sizes;
}

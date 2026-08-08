package com.coffeeshop.table.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableDTO {
    private Long id;
    private int number;
    private int seats;
    private String status;
}

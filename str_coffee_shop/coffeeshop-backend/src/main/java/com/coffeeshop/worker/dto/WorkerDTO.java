package com.coffeeshop.worker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkerDTO {
    private Long id;
    private String name;
    private String username;
    private String status;
    private String joined;
}

package com.coffeeshop.worker.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WorkerReportDTO(
        Long id,
        String name,
        String username,
        String status,
        String joined,
        LocalDateTime lastCheckIn,
        LocalDateTime lastCheckOut,
        long ordersSold,
        BigDecimal salesTotal
) {}

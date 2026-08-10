package com.coffeeshop.worker.dto;

import java.time.LocalDateTime;

public record ShiftReportDTO(
        Long id,
        String workerName,
        String username,
        LocalDateTime checkInAt,
        LocalDateTime checkOutAt
) {}

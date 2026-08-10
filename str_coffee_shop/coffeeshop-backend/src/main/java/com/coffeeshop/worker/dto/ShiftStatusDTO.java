package com.coffeeshop.worker.dto;

import java.time.LocalDateTime;

public record ShiftStatusDTO(boolean checkedIn, LocalDateTime checkInAt, LocalDateTime checkOutAt) {}

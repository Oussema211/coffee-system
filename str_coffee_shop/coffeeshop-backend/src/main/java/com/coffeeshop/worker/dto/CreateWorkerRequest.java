package com.coffeeshop.worker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateWorkerRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;
}
